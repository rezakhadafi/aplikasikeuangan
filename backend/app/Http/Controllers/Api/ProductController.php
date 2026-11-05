<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    /**
     * List products of active business.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Product::query();

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->query('search') . '%');
        }

        if ($request->boolean('low_stock_only')) {
            $query->whereColumn('stock', '<=', 'min_stock');
        }

        $products = $query->orderBy('name')->get();

        return response()->json(['data' => $products]);
    }

    /**
     * Store new product.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'cost_price' => ['nullable', 'numeric', 'min:0'],
            'sell_price' => ['required', 'numeric', 'min:0'],
            'stock' => ['nullable', 'integer', 'min:0'],
            'min_stock' => ['nullable', 'integer', 'min:0'],
        ]);

        return DB::transaction(function () use ($validated) {
            $product = Product::create($validated);

            if (!empty($validated['stock']) && $validated['stock'] > 0) {
                StockMovement::create([
                    'product_id' => $product->id,
                    'movement' => 'in',
                    'qty' => $validated['stock'],
                    'ref' => 'Stok Awal',
                ]);
            }

            return response()->json([
                'message' => 'Produk berhasil ditambahkan.',
                'data' => $product,
            ], 201);
        });
    }

    /**
     * Show product details.
     */
    public function show(Product $product): JsonResponse
    {
        return response()->json([
            'data' => $product->load('stockMovements'),
        ]);
    }

    /**
     * Update product.
     */
    public function update(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'cost_price' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'sell_price' => ['sometimes', 'required', 'numeric', 'min:0'],
            'min_stock' => ['sometimes', 'nullable', 'integer', 'min:0'],
        ]);

        $product->update($validated);

        return response()->json([
            'message' => 'Produk berhasil diperbarui.',
            'data' => $product,
        ]);
    }

    /**
     * Manual stock adjustment.
     */
    public function adjustStock(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'movement' => ['required', 'in:in,out,adjust'],
            'qty' => ['required', 'integer', 'min:1'],
            'ref' => ['nullable', 'string', 'max:100'],
        ]);

        return DB::transaction(function () use ($product, $validated) {
            if ($validated['movement'] === 'in') {
                $product->increment('stock', $validated['qty']);
            } elseif ($validated['movement'] === 'out') {
                $product->decrement('stock', $validated['qty']);
            } else {
                // Adjust to exact quantity
                $product->update(['stock' => $validated['qty']]);
            }

            StockMovement::create([
                'product_id' => $product->id,
                'movement' => $validated['movement'],
                'qty' => $validated['qty'],
                'ref' => $validated['ref'] ?? 'Penyesuaian Manual',
            ]);

            return response()->json([
                'message' => 'Stok berhasil diperbarui.',
                'data' => $product->fresh(),
            ]);
        });
    }

    /**
     * Delete product.
     */
    public function destroy(Product $product): JsonResponse
    {
        $product->delete();

        return response()->json(['message' => 'Produk berhasil dihapus.']);
    }
}

