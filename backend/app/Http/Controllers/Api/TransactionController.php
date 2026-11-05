<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Services\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class TransactionController extends Controller
{
    /**
     * List transactions with filtering, search, and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Transaction::with(['category', 'contact', 'user']);

        if ($request->filled('type')) {
            $query->where('type', $request->query('type'));
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->query('category_id'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('trx_date', '>=', $request->query('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('trx_date', '<=', $request->query('date_to'));
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('note', 'like', "%{$search}%")
                  ->orWhereHas('category', function ($catQ) use ($search) {
                      $catQ->where('name', 'like', "%{$search}%");
                  });
            });
        }

        $perPage = min((int) $request->query('per_page', 15), 100);
        $transactions = $query->orderBy('trx_date', 'desc')->orderBy('id', 'desc')->paginate($perPage);

        return response()->json($transactions);
    }

    /**
     * Store a new transaction.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'in:income,expense'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'trx_date' => ['required', 'date'],
            'category_id' => ['nullable', 'exists:categories,id'],
            'contact_id' => ['nullable', 'exists:contacts,id'],
            'payment_method' => ['nullable', 'string', 'max:30'],
            'note' => ['nullable', 'string', 'max:1000'],
            'attachment' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'], // max 5MB
            'items' => ['nullable', 'array'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.qty' => ['required', 'integer', 'min:1'],
            'items.*.price' => ['required', 'numeric', 'min:0'],
        ]);

        return DB::transaction(function () use ($request, $validated) {
            $tenantContext = app(TenantContext::class);
            $businessId = $tenantContext->getBusinessId();

            $attachmentPath = null;
            if ($request->hasFile('attachment')) {
                $file = $request->file('attachment');
                $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
                $attachmentPath = $file->storeAs('attachments/' . $businessId, $filename, 'public');
            }

            $transaction = Transaction::create([
                'business_id' => $businessId,
                'category_id' => $validated['category_id'] ?? null,
                'contact_id' => $validated['contact_id'] ?? null,
                'user_id' => $request->user()->id,
                'type' => $validated['type'],
                'amount' => $validated['amount'],
                'trx_date' => $validated['trx_date'],
                'payment_method' => $validated['payment_method'] ?? 'cash',
                'note' => $validated['note'] ?? null,
                'attachment' => $attachmentPath,
            ]);

            // Process optional transaction items
            if (!empty($validated['items'])) {
                foreach ($validated['items'] as $item) {
                    $subtotal = $item['qty'] * $item['price'];
                    TransactionItem::create([
                        'transaction_id' => $transaction->id,
                        'product_id' => $item['product_id'],
                        'qty' => $item['qty'],
                        'price' => $item['price'],
                        'subtotal' => $subtotal,
                    ]);

                    // Adjust product stock if sale (income)
                    if ($transaction->type === 'income') {
                        $product = Product::find($item['product_id']);
                        if ($product) {
                            $product->decrement('stock', $item['qty']);
                            StockMovement::create([
                                'product_id' => $product->id,
                                'movement' => 'out',
                                'qty' => $item['qty'],
                                'ref' => 'Trx #' . $transaction->id,
                            ]);
                        }
                    }
                }
            }

            // Log activity
            ActivityLog::create([
                'business_id' => $businessId,
                'user_id' => $request->user()->id,
                'action' => 'create',
                'entity' => 'Transaction',
                'entity_id' => $transaction->id,
                'description' => "Menambahkan transaksi {$transaction->type} senilai Rp " . number_format($transaction->amount, 0, ',', '.'),
            ]);

            return response()->json([
                'message' => 'Transaksi berhasil dicatat.',
                'data' => $transaction->load(['category', 'contact', 'items.product']),
            ], 201);
        });
    }

    /**
     * Show transaction details.
     */
    public function show(Transaction $transaction): JsonResponse
    {
        return response()->json([
            'data' => $transaction->load(['category', 'contact', 'user', 'items.product']),
        ]);
    }

    /**
     * Update transaction.
     */
    public function update(Request $request, Transaction $transaction): JsonResponse
    {
        $validated = $request->validate([
            'category_id' => ['sometimes', 'nullable', 'exists:categories,id'],
            'contact_id' => ['sometimes', 'nullable', 'exists:contacts,id'],
            'amount' => ['sometimes', 'required', 'numeric', 'min:0.01'],
            'trx_date' => ['sometimes', 'required', 'date'],
            'payment_method' => ['sometimes', 'nullable', 'string', 'max:30'],
            'note' => ['sometimes', 'nullable', 'string', 'max:1000'],
        ]);

        $transaction->update($validated);

        ActivityLog::create([
            'business_id' => $transaction->business_id,
            'user_id' => $request->user()->id,
            'action' => 'update',
            'entity' => 'Transaction',
            'entity_id' => $transaction->id,
            'description' => "Memperbarui transaksi #{$transaction->id}",
        ]);

        return response()->json([
            'message' => 'Transaksi berhasil diperbarui.',
            'data' => $transaction->load(['category', 'contact']),
        ]);
    }

    /**
     * Delete transaction.
     */
    public function destroy(Request $request, Transaction $transaction): JsonResponse
    {
        $businessId = $transaction->business_id;
        $trxId = $transaction->id;

        $transaction->delete();

        ActivityLog::create([
            'business_id' => $businessId,
            'user_id' => $request->user()->id,
            'action' => 'delete',
            'entity' => 'Transaction',
            'entity_id' => $trxId,
            'description' => "Menghapus transaksi #{$trxId}",
        ]);

        return response()->json([
            'message' => 'Transaksi berhasil dihapus.',
        ]);
    }
}

