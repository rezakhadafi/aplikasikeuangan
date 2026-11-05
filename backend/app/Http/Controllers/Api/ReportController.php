<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Transaction;
use App\Services\TenantContext;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    /**
     * Profit & Loss report (Laporan Laba / Rugi).
     */
    public function profitLoss(Request $request): JsonResponse
    {
        $dateFrom = $request->query('date_from', Carbon::now()->startOfMonth()->toDateString());
        $dateTo = $request->query('date_to', Carbon::now()->endOfMonth()->toDateString());

        // Incomes grouped by category
        $incomes = Transaction::where('transactions.type', 'income')
            ->whereBetween('transactions.trx_date', [$dateFrom, $dateTo])
            ->join('categories', 'transactions.category_id', '=', 'categories.id')
            ->select('categories.name as category_name', DB::raw('SUM(transactions.amount) as total'))
            ->groupBy('categories.name')
            ->get();

        $totalIncome = (float) $incomes->sum('total');

        // Expenses grouped by category
        $expenses = Transaction::where('transactions.type', 'expense')
            ->whereBetween('transactions.trx_date', [$dateFrom, $dateTo])
            ->join('categories', 'transactions.category_id', '=', 'categories.id')
            ->select('categories.name as category_name', DB::raw('SUM(transactions.amount) as total'))
            ->groupBy('categories.name')
            ->get();

        $totalExpense = (float) $expenses->sum('total');
        $netProfit = $totalIncome - $totalExpense;

        return response()->json([
            'period' => [
                'from' => $dateFrom,
                'to' => $dateTo,
            ],
            'income_items' => $incomes,
            'total_income' => $totalIncome,
            'expense_items' => $expenses,
            'total_expense' => $totalExpense,
            'net_profit' => $netProfit,
        ]);
    }

    /**
     * Cash flow report.
     */
    public function cashFlow(Request $request): JsonResponse
    {
        $dateFrom = $request->query('date_from', Carbon::now()->startOfMonth()->toDateString());
        $dateTo = $request->query('date_to', Carbon::now()->endOfMonth()->toDateString());

        $totalIn = (float) Transaction::where('type', 'income')
            ->whereBetween('trx_date', [$dateFrom, $dateTo])
            ->sum('amount');

        $totalOut = (float) Transaction::where('type', 'expense')
            ->whereBetween('trx_date', [$dateFrom, $dateTo])
            ->sum('amount');

        $dailyBreakdown = Transaction::whereBetween('trx_date', [$dateFrom, $dateTo])
            ->select(
                'trx_date',
                DB::raw("SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income"),
                DB::raw("SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense")
            )
            ->groupBy('trx_date')
            ->orderBy('trx_date')
            ->get();

        return response()->json([
            'period' => [
                'from' => $dateFrom,
                'to' => $dateTo,
            ],
            'total_cash_in' => $totalIn,
            'total_cash_out' => $totalOut,
            'net_cash_flow' => $totalIn - $totalOut,
            'daily_breakdown' => $dailyBreakdown,
        ]);
    }

    /**
     * Category distribution for charts.
     */
    public function byCategory(Request $request): JsonResponse
    {
        $type = $request->query('type', 'expense');
        $dateFrom = $request->query('date_from', Carbon::now()->startOfMonth()->toDateString());
        $dateTo = $request->query('date_to', Carbon::now()->endOfMonth()->toDateString());

        $distribution = Transaction::where('transactions.type', $type)
            ->whereBetween('transactions.trx_date', [$dateFrom, $dateTo])
            ->leftJoin('categories', 'transactions.category_id', '=', 'categories.id')
            ->select(
                DB::raw("COALESCE(categories.name, 'Lain-lain') as name"),
                DB::raw('SUM(transactions.amount) as value')
            )
            ->groupBy('categories.name')
            ->orderByDesc('value')
            ->get();

        return response()->json(['data' => $distribution]);
    }

    /**
     * Export reports to PDF or CSV/Excel.
     */
    public function export(Request $request)
    {
        $format = $request->query('format', 'pdf');
        $dateFrom = $request->query('date_from', Carbon::now()->startOfMonth()->toDateString());
        $dateTo = $request->query('date_to', Carbon::now()->endOfMonth()->toDateString());
        $business = app(TenantContext::class)->getBusiness();

        $transactions = Transaction::with('category')
            ->whereBetween('trx_date', [$dateFrom, $dateTo])
            ->orderBy('trx_date', 'asc')
            ->get();

        $totalIncome = (float) $transactions->where('type', 'income')->sum('amount');
        $totalExpense = (float) $transactions->where('type', 'expense')->sum('amount');

        if ($format === 'pdf') {
            $data = [
                'business' => $business,
                'dateFrom' => $dateFrom,
                'dateTo' => $dateTo,
                'transactions' => $transactions,
                'totalIncome' => $totalIncome,
                'totalExpense' => $totalExpense,
                'netProfit' => $totalIncome - $totalExpense,
            ];

            $pdf = Pdf::loadView('reports.financial_pdf', $data);
            return $pdf->download("Laporan_Keuangan_{$business?->name}_{$dateFrom}_{$dateTo}.pdf");
        }

        // CSV export
        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"Laporan_Keuangan_{$business?->name}_{$dateFrom}.csv\"",
        ];

        return new StreamedResponse(function () use ($transactions) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['ID', 'Tanggal', 'Tipe', 'Kategori', 'Nominal (Rp)', 'Metode Bayar', 'Catatan']);

            foreach ($transactions as $trx) {
                fputcsv($handle, [
                    $trx->id,
                    $trx->trx_date->format('Y-m-d'),
                    $trx->type === 'income' ? 'Pemasukan' : 'Pengeluaran',
                    $trx->category?->name ?? '-',
                    $trx->amount,
                    $trx->payment_method,
                    $trx->note,
                ]);
            }

            fclose($handle);
        }, 200, $headers);
    }
}

