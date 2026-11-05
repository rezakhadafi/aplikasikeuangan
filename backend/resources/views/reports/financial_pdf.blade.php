<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Laporan Keuangan - {{ $business?->name }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            color: #333;
            margin: 20px;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #059669;
            padding-bottom: 12px;
            margin-bottom: 20px;
        }
        .header h1 {
            margin: 0;
            color: #065f46;
            font-size: 20px;
        }
        .header p {
            margin: 4px 0 0;
            color: #666;
        }
        .summary-box {
            width: 100%;
            margin-bottom: 20px;
            border-collapse: collapse;
        }
        .summary-box td {
            padding: 10px;
            border: 1px solid #e5e7eb;
            background: #f9fafb;
            text-align: center;
        }
        .summary-title {
            font-size: 11px;
            text-transform: uppercase;
            color: #6b7280;
            margin-bottom: 4px;
        }
        .summary-val {
            font-size: 16px;
            font-weight: bold;
        }
        .income-val { color: #059669; }
        .expense-val { color: #dc2626; }
        .profit-val { color: #1e40af; }
        table.data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        table.data-table th {
            background-color: #059669;
            color: #fff;
            padding: 8px;
            text-align: left;
            font-size: 11px;
        }
        table.data-table td {
            padding: 8px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 11px;
        }
        table.data-table tr:nth-child(even) {
            background-color: #f9fafb;
        }
        .footer {
            margin-top: 30px;
            text-align: right;
            font-size: 10px;
            color: #9ca3af;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ $business?->name ?? 'KasUMKM' }}</h1>
        <p>Laporan Transaksi & Arus Kas | Periode: {{ $dateFrom }} s/d {{ $dateTo }}</p>
    </div>

    <table class="summary-box">
        <tr>
            <td>
                <div class="summary-title">Total Pemasukan</div>
                <div class="summary-val income-val">+Rp {{ number_format($totalIncome, 0, ',', '.') }}</div>
            </td>
            <td>
                <div class="summary-title">Total Pengeluaran</div>
                <div class="summary-val expense-val">-Rp {{ number_format($totalExpense, 0, ',', '.') }}</div>
            </td>
            <td>
                <div class="summary-title">Laba / (Rugi) Bersih</div>
                <div class="summary-val profit-val">Rp {{ number_format($netProfit, 0, ',', '.') }}</div>
            </td>
        </tr>
    </table>

    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 15%;">Tanggal</th>
                <th style="width: 12%;">Tipe</th>
                <th style="width: 20%;">Kategori</th>
                <th style="width: 25%;">Catatan</th>
                <th style="width: 13%;">Metode</th>
                <th style="width: 15%; text-align: right;">Nominal</th>
            </tr>
        </thead>
        <tbody>
            @forelse($transactions as $trx)
            <tr>
                <td>{{ $trx->trx_date->format('d/m/Y') }}</td>
                <td>
                    <span style="color: {{ $trx->type === 'income' ? '#059669' : '#dc2626' }}; font-weight: bold;">
                        {{ $trx->type === 'income' ? 'Masuk' : 'Keluar' }}
                    </span>
                </td>
                <td>{{ $trx->category?->name ?? '-' }}</td>
                <td>{{ $trx->note ?? '-' }}</td>
                <td>{{ ucfirst($trx->payment_method) }}</td>
                <td style="text-align: right; font-weight: bold; color: {{ $trx->type === 'income' ? '#059669' : '#dc2626' }};">
                    {{ $trx->type === 'income' ? '+' : '-' }}Rp {{ number_format($trx->amount, 0, ',', '.') }}
                </td>
            </tr>
            @empty
            <tr>
                <td colspan="6" style="text-align: center; color: #9ca3af; padding: 20px;">
                    Tidak ada transaksi pada periode ini.
                </td>
            </tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">
        Dicetak secara otomatis oleh KasUMKM pada {{ date('d-m-Y H:i:s') }}
    </div>
</body>
</html>

