import React, { useState, useEffect } from 'react'
import { X, ArrowUpRight, ArrowDownLeft, Upload, Loader2 } from 'lucide-react'
import api from '../lib/axios'

export default function TransactionModal({ isOpen, onClose, onSuccess }) {
  const [type, setType] = useState('income')
  const [amount, setAmount] = useState('')
  const [trxDate, setTrxDate] = useState(new Date().toISOString().split('T')[0])
  const [categoryId, setCategoryId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [note, setNote] = useState('')
  const [categories, setCategories] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Fetch categories when modal opens or type changes
  useEffect(() => {
    if (isOpen) {
      setLoadingCategories(true)
      api.get(`/categories?type=${type}`)
        .then((res) => {
          setCategories(res.data.data || [])
          if (res.data.data && res.data.data.length > 0) {
            setCategoryId(String(res.data.data[0].id))
          } else {
            setCategoryId('')
          }
        })
        .catch(() => {})
        .finally(() => setLoadingCategories(false))
    }
  }, [isOpen, type])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const numericAmount = parseFloat(amount.replace(/[^0-9]/g, ''))
    if (!numericAmount || numericAmount <= 0) {
      setError('Masukkan nominal transaksi yang valid.')
      return
    }

    setSubmitting(true)
    try {
      await api.post('/transactions', {
        type,
        amount: numericAmount,
        trx_date: trxDate,
        category_id: categoryId ? parseInt(categoryId) : null,
        payment_method: paymentMethod,
        note,
      })

      setAmount('')
      setNote('')
      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal menyimpan transaksi.'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  // Format currency display input
  const handleAmountChange = (e) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '')
    if (!rawValue) {
      setAmount('')
      return
    }
    const formatted = new Intl.NumberFormat('id-ID').format(rawValue)
    setAmount(formatted)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 text-lg">Catat Transaksi</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          {/* Type Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              Pemasukan
            </button>
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition ${
                type === 'expense'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              Pengeluaran
            </button>
          </div>

          {/* Nominal */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Nominal (Rp) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">
                Rp
              </span>
              <input
                type="text"
                required
                autoFocus
                placeholder="0"
                value={amount}
                onChange={handleAmountChange}
                className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold text-slate-900 focus:bg-white focus:outline-emerald-500 transition"
              />
            </div>
          </div>

          {/* Date & Category in 2 columns */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Tanggal *
              </label>
              <input
                type="date"
                required
                value={trxDate}
                onChange={(e) => setTrxDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-emerald-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Kategori *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={loadingCategories}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-emerald-500 transition"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Metode Pembayaran
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-emerald-500 transition"
            >
              <option value="cash">Tunai (Cash)</option>
              <option value="transfer">Transfer Bank</option>
              <option value="qris">QRIS / E-Wallet</option>
            </select>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Catatan (opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: Order no. 12 / Pelanggan Pak Joko"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-emerald-500 transition"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 px-4 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`w-2/3 py-2.5 px-4 rounded-xl text-sm font-bold text-white shadow-md transition flex items-center justify-center gap-2 ${
                type === 'income'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan Transaksi'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

