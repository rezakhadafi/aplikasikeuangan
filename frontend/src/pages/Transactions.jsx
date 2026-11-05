import React, { useState, useEffect } from 'react'
import {
  PlusCircle,
  Search,
  Filter,
  Trash2,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import api from '../lib/axios'
import { useAuth } from '../context/AuthContext'
import TransactionModal from '../components/TransactionModal'

export default function Transactions() {
  const { activeBusiness } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)

  const fetchTransactions = (targetPage = 1) => {
    setLoading(true)
    let url = `/transactions?page=${targetPage}`
    if (typeFilter) url += `&type=${typeFilter}`
    if (search) url += `&search=${encodeURIComponent(search)}`

    api.get(url)
      .then((res) => {
        setTransactions(res.data.data || [])
        setPagination({
          current_page: res.data.current_page,
          last_page: res.data.last_page,
          total: res.data.total,
        })
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchTransactions(page)
  }, [typeFilter, page, activeBusiness?.id])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    fetchTransactions(1)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus transaksi ini?')) return
    try {
      await api.delete(`/transactions/${id}`)
      fetchTransactions(page)
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus transaksi.')
    }
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
            Catatan Transaksi
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar seluruh arus kas masuk & keluar usaha Anda
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
        >
          <PlusCircle className="w-5 h-5" />
          <span>+ Tambah Transaksi</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari catatan atau kategori..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-emerald-500 transition"
          />
        </form>

        {/* Type Filter Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => { setTypeFilter(''); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              typeFilter === '' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => { setTypeFilter('income'); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              typeFilter === 'income' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Pemasukan
          </button>
          <button
            onClick={() => { setTypeFilter('expense'); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              typeFilter === 'expense' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'
            }`}
          >
            Pengeluaran
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            <span>Memuat transaksi...</span>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-20 space-y-2">
            <p className="text-slate-400 text-sm">Tidak ada transaksi ditemukan.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-emerald-600 font-bold text-xs hover:underline cursor-pointer"
            >
              Catat transaksi sekarang
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Tanggal</th>
                  <th className="px-5 py-3.5">Kategori</th>
                  <th className="px-5 py-3.5">Catatan / Detail</th>
                  <th className="px-5 py-3.5">Metode</th>
                  <th className="px-5 py-3.5 text-right">Nominal</th>
                  <th className="px-5 py-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((trx) => (
                  <tr key={trx.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3.5 font-medium text-slate-700 whitespace-nowrap">
                      {trx.trx_date}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md font-semibold text-[11px]">
                        {trx.category?.name || 'Tanpa Kategori'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 max-w-xs truncate">
                      {trx.note || '-'}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 uppercase text-[10px] font-bold">
                      {trx.payment_method}
                    </td>
                    <td className={`px-5 py-3.5 text-right font-black whitespace-nowrap ${
                      trx.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {trx.type === 'income' ? '+' : '-'}{formatRupiah(trx.amount)}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => handleDelete(trx.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination && pagination.last_page > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50">
            <span className="text-xs text-slate-500">
              Total {pagination.total} transaksi (Hal {pagination.current_page} dari {pagination.last_page})
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-100"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= pagination.last_page}
                onClick={() => setPage((p) => Math.min(pagination.last_page, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-100"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchTransactions(1)}
      />
    </div>
  )
}

