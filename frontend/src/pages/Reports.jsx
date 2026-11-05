import React, { useState, useEffect } from 'react'
import {
  FileSpreadsheet,
  Download,
  Calendar,
  FileText,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
} from 'lucide-react'
import api from '../lib/axios'
import { useAuth } from '../context/AuthContext'

export default function Reports() {
  const { activeBusiness } = useAuth()
  const [reportType, setReportType] = useState('profit-loss')
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]
  })
  const [dateTo, setDateTo] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0]
  })

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchReport = () => {
    setLoading(true)
    const endpoint = reportType === 'profit-loss' ? '/reports/profit-loss' : '/reports/cash-flow'
    api.get(`${endpoint}?date_from=${dateFrom}&date_to=${dateTo}`)
      .then((res) => setData(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchReport()
  }, [reportType, dateFrom, dateTo, activeBusiness?.id])

  const handleExport = (format) => {
    const token = localStorage.getItem('kasumkm_token')
    const bizId = activeBusiness?.id
    const url = `/api/v1/reports/export?format=${format}&date_from=${dateFrom}&date_to=${dateTo}&type=${reportType}`
    
    // Download file directly
    window.open(url, '_blank')
  }

  const formatRupiah = (val) => {
    return 'Rp ' + new Intl.NumberFormat('id-ID').format(val || 0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Laporan Keuangan
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Laporan laba rugi, arus kas, dan ekspor dokumen resmi
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-md shadow-red-600/20 transition cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Ekspor PDF</span>
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-md shadow-emerald-700/20 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor CSV / Excel</span>
          </button>
        </div>
      </div>

      {/* Filter and Period Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Toggle Report Type */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full md:w-auto">
          <button
            onClick={() => setReportType('profit-loss')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition ${
              reportType === 'profit-loss' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Laba / Rugi
          </button>
          <button
            onClick={() => setReportType('cash-flow')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition ${
              reportType === 'cash-flow' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Arus Kas (Cash Flow)
          </button>
        </div>

        {/* Date Pickers */}
        <div className="flex items-center gap-2 w-full md:w-auto text-xs">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <span className="text-slate-400">Dari:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-hidden"
            />
          </div>
          <span className="text-slate-400">—</span>
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <span className="text-slate-400">Sampai:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          <span>Menghitung rekapitulasi laporan...</span>
        </div>
      ) : reportType === 'profit-loss' ? (
        /* Laba Rugi Display */
        <div className="space-y-6">
          {/* Summary Box */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-emerald-50 border border-emerald-200/80 p-5 rounded-2xl">
              <span className="text-xs font-bold uppercase text-emerald-800 tracking-wider">Total Pendapatan</span>
              <div className="text-2xl font-black text-emerald-700 mt-1">
                +{formatRupiah(data?.total_income)}
              </div>
            </div>

            <div className="bg-red-50 border border-red-200/80 p-5 rounded-2xl">
              <span className="text-xs font-bold uppercase text-red-800 tracking-wider">Total Beban / Pengeluaran</span>
              <div className="text-2xl font-black text-red-700 mt-1">
                -{formatRupiah(data?.total_expense)}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200/80 p-5 rounded-2xl">
              <span className="text-xs font-bold uppercase text-blue-800 tracking-wider">Laba / (Rugi) Bersih</span>
              <div className={`text-2xl font-black mt-1 ${
                (data?.net_profit || 0) >= 0 ? 'text-blue-700' : 'text-red-700'
              }`}>
                {formatRupiah(data?.net_profit)}
              </div>
            </div>
          </div>

          {/* Breakdown Per Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Income breakdown */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
                Rincian Pemasukan per Kategori
              </h3>
              <div className="divide-y divide-slate-100 text-xs">
                {(data?.income_items || []).length === 0 ? (
                  <p className="py-4 text-slate-400 text-center">Tidak ada pemasukan pada periode ini.</p>
                ) : (
                  data.income_items.map((item, idx) => (
                    <div key={idx} className="py-2.5 flex justify-between items-center">
                      <span className="font-semibold text-slate-700">{item.category_name}</span>
                      <span className="font-bold text-emerald-600">+{formatRupiah(item.total)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Expense breakdown */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
                Rincian Pengeluaran per Kategori
              </h3>
              <div className="divide-y divide-slate-100 text-xs">
                {(data?.expense_items || []).length === 0 ? (
                  <p className="py-4 text-slate-400 text-center">Tidak ada pengeluaran pada periode ini.</p>
                ) : (
                  data.expense_items.map((item, idx) => (
                    <div key={idx} className="py-2.5 flex justify-between items-center">
                      <span className="font-semibold text-slate-700">{item.category_name}</span>
                      <span className="font-bold text-red-600">-{formatRupiah(item.total)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Cash Flow Display */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs text-slate-500 font-bold">Total Kas Masuk</span>
              <div className="text-xl font-bold text-emerald-600">+{formatRupiah(data?.total_cash_in)}</div>
            </div>
            <div>
              <span className="text-xs text-slate-500 font-bold">Total Kas Keluar</span>
              <div className="text-xl font-bold text-red-600">-{formatRupiah(data?.total_cash_out)}</div>
            </div>
            <div>
              <span className="text-xs text-slate-500 font-bold">Perubahan Kas Bersih</span>
              <div className="text-xl font-bold text-slate-900">{formatRupiah(data?.net_cash_flow)}</div>
            </div>
          </div>

          <h4 className="font-bold text-xs uppercase text-slate-500">Mutasi Kas Harian</h4>
          <div className="divide-y divide-slate-100 text-xs">
            {(data?.daily_breakdown || []).map((row, idx) => (
              <div key={idx} className="py-2.5 flex justify-between items-center">
                <span className="font-medium text-slate-700">{row.trx_date}</span>
                <div className="flex gap-4">
                  <span className="text-emerald-600 font-bold">+{formatRupiah(row.income)}</span>
                  <span className="text-red-600 font-bold">-{formatRupiah(row.expense)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

