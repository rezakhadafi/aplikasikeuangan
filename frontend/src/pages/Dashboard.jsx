import React, { useState, useEffect } from 'react'
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  PlusCircle,
  AlertTriangle,
  TrendingUp,
  ReceiptText,
  Loader2,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts'
import api from '../lib/axios'
import { useAuth } from '../context/AuthContext'
import TransactionModal from '../components/TransactionModal'

export default function Dashboard() {
  const { activeBusiness } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchDashboard = () => {
    setLoading(true)
    api.get('/dashboard/summary')
      .then((res) => setData(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchDashboard()
  }, [activeBusiness?.id])

  const formatRupiah = (val) => {
    return 'Rp ' + new Intl.NumberFormat('id-ID').format(val || 0)
  }

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Dashboard Keuangan
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Usaha Aktif: <strong className="text-slate-800">{activeBusiness?.name}</strong> (Peran: {activeBusiness?.role})
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
        >
          <PlusCircle className="w-5 h-5" />
          <span>+ Catat Transaksi</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          <span>Memuat data dashboard...</span>
        </div>
      ) : (
        <>
          {/* Low Stock Banner Alert */}
          {data?.summary?.low_stock_count > 0 && (
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <strong>Peringatan Stok Menipis:</strong> Ada{' '}
                <span className="font-bold underline">{data.summary.low_stock_count} produk</span> yang stoknya di bawah batas minimum.
              </div>
            </div>
          )}

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Saldo Kas */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Saldo Kas Saat Ini</span>
                <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Wallet className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {formatRupiah(data?.summary?.current_balance)}
              </div>
              <p className="text-[11px] text-emerald-600 font-semibold">Kas bersih akumulasi</p>
            </div>

            {/* Pemasukan Bulan Ini */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Pemasukan Bulan Ini</span>
                <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-emerald-600">
                +{formatRupiah(data?.summary?.month_income)}
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Bulan berjalan</p>
            </div>

            {/* Pengeluaran Bulan Ini */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Pengeluaran Bulan Ini</span>
                <span className="p-2 bg-red-50 text-red-600 rounded-xl">
                  <ArrowDownLeft className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-red-600">
                -{formatRupiah(data?.summary?.month_expense)}
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Biaya & operasional</p>
            </div>

            {/* Laba Bersih Bulan Ini */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Laba Bersih Bulan Ini</span>
                <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>
              <div className={`text-2xl font-black ${
                (data?.summary?.net_profit || 0) >= 0 ? 'text-blue-600' : 'text-red-600'
              }`}>
                {formatRupiah(data?.summary?.net_profit)}
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Pemasukan - Pengeluaran</p>
            </div>
          </div>

          {/* Chart & Recent Transactions Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart (2 cols) */}
            <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Tren Keuangan 6 Bulan Terakhir</h3>
                  <p className="text-xs text-slate-400">Komparasi Pemasukan vs Pengeluaran</p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.monthly_trend || []}>
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `Rp ${val / 1000}k`} />
                    <Tooltip
                      formatter={(val) => formatRupiah(val)}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="income" name="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Pengeluaran" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Transactions List (1 col) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800 text-base">Transaksi Terbaru</h3>
                  <ReceiptText className="w-4 h-4 text-slate-400" />
                </div>

                <div className="divide-y divide-slate-100 mt-2">
                  {(data?.recent_transactions || []).length === 0 ? (
                    <p className="py-8 text-center text-xs text-slate-400">
                      Belum ada transaksi tercatat.
                    </p>
                  ) : (
                    data.recent_transactions.map((trx) => (
                      <div key={trx.id} className="py-3 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-xs text-slate-800">
                            {trx.category?.name || 'Tanpa Kategori'}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {trx.trx_date} • {trx.note || trx.payment_method}
                          </div>
                        </div>
                        <div className={`text-xs font-bold ${
                          trx.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {trx.type === 'income' ? '+' : '-'}{formatRupiah(trx.amount)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Transaction Record Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchDashboard}
      />
    </div>
  )
}

