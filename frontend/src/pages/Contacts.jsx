import React, { useState, useEffect } from 'react'
import { Users, PlusCircle, Trash2, Phone, X, Loader2 } from 'lucide-react'
import api from '../lib/axios'
import { useAuth } from '../context/AuthContext'

export default function Contacts() {
  const { activeBusiness } = useAuth()
  const [contacts, setContacts] = useState([])
  const [typeFilter, setTypeFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Form state
  const [type, setType] = useState('customer')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  const fetchContacts = () => {
    setLoading(true)
    let url = '/contacts'
    if (typeFilter) url += `?type=${typeFilter}`
    api.get(url)
      .then((res) => setContacts(res.data.data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchContacts()
  }, [typeFilter, activeBusiness?.id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/contacts', { type, name, phone })
      setIsModalOpen(false)
      setName('')
      setPhone('')
      fetchContacts()
    } catch (err) {
      alert('Gagal menambahkan kontak.')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus kontak ini?')) return
    try {
      await api.delete(`/contacts/${id}`)
      fetchContacts()
    } catch (err) {
      alert('Gagal menghapus kontak.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Pelanggan & Pemasok
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar relasi bisnis Anda untuk mempermudah pencatatan transaksi
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
        >
          <PlusCircle className="w-5 h-5" />
          <span>+ Tambah Kontak</span>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setTypeFilter('')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            typeFilter === '' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Semua ({contacts.length})
        </button>
        <button
          onClick={() => setTypeFilter('customer')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            typeFilter === 'customer' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          }`}
        >
          Pelanggan
        </button>
        <button
          onClick={() => setTypeFilter('supplier')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            typeFilter === 'supplier' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
          }`}
        >
          Pemasok
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            <span>Memuat kontak...</span>
          </div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-xs">
            Belum ada kontak dalam daftar ini.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Nama Kontak</th>
                <th className="px-5 py-3.5">Tipe</th>
                <th className="px-5 py-3.5">Nomor Telepon</th>
                <th className="px-5 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contacts.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-5 py-3.5 font-bold text-slate-800">{c.name}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                      c.type === 'customer' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                    }`}>
                      {c.type === 'customer' ? 'Pelanggan' : 'Pemasok'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">
                    {c.phone ? (
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {c.phone}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800">Tambah Kontak Baru</h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tipe Kontak</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('customer')}
                    className={`py-2 rounded-lg text-xs font-bold ${
                      type === 'customer' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Pelanggan
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('supplier')}
                    className={`py-2 rounded-lg text-xs font-bold ${
                      type === 'supplier' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Pemasok
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pak Joko / Toko Makmur"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor WhatsApp / Telp</label>
                <input
                  type="text"
                  placeholder="08123456789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-emerald-700"
                >
                  Simpan Kontak
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

