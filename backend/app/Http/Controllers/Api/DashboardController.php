<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Get financial summary and charts data for active business.
     */
    public function summary(Request $request): JsonResponse
    {
        $now = Carbon::now();
        $startOfMonth = $now->copy()->startOfMonth()->toDateString();
        $endOfMonth = $now->copy()->endOfMonth()->toDateString();

        // 1. All-time cash balance
        $totalIncomeAllTime = (float) Transaction::where('type', 'income')->sum('amount');
        $totalExpenseAllTime = (float) Transaction::where('type', 'expense')->sum('amount');
        $currentBalance = $totalIncomeAllTime - $totalExpenseAllTime;

        // 2. Current Month metrics
        $monthIncome = (float) Transaction::where('type', 'income')
            ->whereBetween('trx_date', [$startOfMonth, $endOfMonth])
            ->sum('amount');

        $monthExpense = (float) Transaction::where('type', 'expense')
            ->whereBetween('trx_date', [$startOfMonth, $endOfMonth])
            ->sum('amount');

        $netProfit = $monthIncome - $monthExpense;

        // 3. Last 6 months trend
        $monthlyTrend = [];
        for ($i = 5; $i >= 0; $i--) {
            $monthDate = $now->copy()->subMonths($i);
            $mStart = $monthDate->copy()->startOfMonth()->toDateString();
            $mEnd = $monthDate->copy()->endOfMonth()->toDateString();

            $inc = (float) Transaction::where('type', 'income')
                ->whereBetween('trx_date', [$mStart, $mEnd])
                ->sum('amount');

            $exp = (float) Transaction::where('type', 'expense')
                ->whereBetween('trx_date', [$mStart, $mEnd])
                ->sum('amount');

            $monthlyTrend[] = [
                'month' => $monthDate->translatedFormat('M Y'),
                'income' => $inc,
                'expense' => $exp,
                'net' => $inc - $exp,
            ];
        }

        // 4. Recent transactions
        $recentTransactions = Transaction::with('category')
            ->orderBy('trx_date', 'desc')
            ->orderBy('id', 'desc')
            ->limit(5)
            ->get();

        // 5. Products with low stock alert
        $lowStockCount = Product::whereColumn('stock', '<=', 'min_stock')->count();

        return response()->json([
            'summary' => [
                'current_balance' => $currentBalance,
                'month_income' => $monthIncome,
                'month_expense' => $monthExpense,
                'net_profit' => $netProfit,
                'low_stock_count' => $lowStockCount,
            ],
            'monthly_trend' => $monthlyTrend,
            'recent_transactions' => $recentTransactions,
        ]);
    }
}

