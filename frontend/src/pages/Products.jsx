import React, { useState, useEffect } from 'react'
import {
  Package,
  PlusCircle,
  AlertTriangle,
  ArrowUpDown,
  Trash2,
  Loader2,
  X,
} from 'lucide-react'
import api from '../lib/axios'
import { useAuth } from '../context/AuthContext'

export default function Products() {
  const { activeBusiness } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)

  // Form states
  const [name, setName] = useState('')
  const [costPrice, setCostPrice] = useState('')
  const [sellPrice, setSellPrice] = useState('')
  const [stock, setStock] = useState('')
  const [minStock, setMinStock] = useState('5')

  // Adjust stock state
  const [movement, setMovement] = useState('in')
  const [qty, setQty] = useState('')
  const [ref, setRef] = useState('')

  const fetchProducts = () => {
    setLoading(true)
    api.get('/products')
      .then((res) => setProducts(res.data.data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchProducts()
  }, [activeBusiness?.id])

  const handleAddSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/products', {
        name,
        cost_price: costPrice ? parseFloat(costPrice) : null,
        sell_price: parseFloat(sellPrice),
        stock: stock ? parseInt(stock) : 0,
        min_stock: minStock ? parseInt(minStock) : 0,
      })
      setIsAddModalOpen(false)
      setName('')
      setCostPrice('')
      setSellPrice('')
      setStock('')
      fetchProducts()
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menambahkan produk.')
    }
  }

  const handleAdjustSubmit = async (e) => {
    e.preventDefault()
    if (!selectedProduct) return
    try {
      await api.post(`/products/${selectedProduct.id}/adjust-stock`, {
        movement,
        qty: parseInt(qty),
        ref,
      })
      setIsAdjustModalOpen(false)
      setQty('')
      setRef('')
      fetchProducts()
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mengubah stok.')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus produk ini?')) return
    try {
      await api.delete(`/products/${id}`)
      fetchProducts()
    } catch (err) {
      alert('Gagal menghapus produk.')
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
            Produk & Manajemen Stok
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola katalog produk, harga modal, harga jual, dan stok barang
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
        >
          <PlusCircle className="w-5 h-5" />
          <span>+ Tambah Produk</span>
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            <span>Memuat produk...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 space-y-2">
            <Package className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-slate-400 text-sm">Belum ada produk terdaftar.</p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="text-emerald-600 font-bold text-xs hover:underline cursor-pointer"
            >
              Tambah produk pertama Anda
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Nama Produk</th>
                  <th className="px-5 py-3.5">Harga Modal</th>
                  <th className="px-5 py-3.5">Harga Jual</th>
                  <th className="px-5 py-3.5">Margin Untung</th>
                  <th className="px-5 py-3.5">Sisa Stok</th>
                  <th className="px-5 py-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((prod) => {
                  const margin = prod.cost_price ? prod.sell_price - prod.cost_price : null
                  const isLow = prod.stock <= prod.min_stock

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-3.5 font-bold text-slate-800">
                        {prod.name}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">
                        {prod.cost_price ? formatRupiah(prod.cost_price) : '-'}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        {formatRupiah(prod.sell_price)}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-emerald-600">
                        {margin !== null ? `+${formatRupiah(margin)}` : '-'}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-md font-bold text-xs ${
                            isLow ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {prod.stock} unit
                          </span>
                          {isLow && (
                            <span className="text-[10px] text-red-500 font-semibold flex items-center gap-0.5">
                              <AlertTriangle className="w-3 h-3" /> Menipis
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedProduct(prod)
                            setIsAdjustModalOpen(true)
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                        >
                          <ArrowUpDown className="w-3.5 h-3.5 inline mr-1" />
                          Ubah Stok
                        </button>
                        <button
                          onClick={() => handleDelete(prod.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Add Product */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800">Tambah Produk Baru</h3>
              <button onClick={() => setIsAddModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Produk *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Beras Rojo Lele 5kg"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Harga Modal (Rp)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Harga Jual (Rp) *</label>
                  <input
                    type="number"
                    required
                    placeholder="0"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Stok Awal</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Batas Minimum Notifikasi</label>
                  <input
                    type="number"
                    placeholder="5"
                    value={minStock}
                    onChange={(e) => setMinStock(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-emerald-700"
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Adjust Stock */}
      {isAdjustModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800">Ubah Stok: {selectedProduct.name}</h3>
              <button onClick={() => setIsAdjustModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleAdjustSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Pergerakan</label>
                <select
                  value={movement}
                  onChange={(e) => setMovement(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                >
                  <option value="in">Stok Masuk (+)</option>
                  <option value="out">Stok Keluar (-)</option>
                  <option value="adjust">Penyesuaian Langsung (=)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Jumlah Unit *</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="0"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan / Alasan</label>
                <input
                  type="text"
                  placeholder="Contoh: Kulakan / Barang rusak"
                  value={ref}
                  onChange={(e) => setRef(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-emerald-700"
                >
                  Update Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

