import React, { useState, useEffect } from 'react'
import {
  Building2,
  Users,
  PlusCircle,
  ShieldCheck,
  UserCheck,
  LogOut,
  Loader2,
  Check,
} from 'lucide-react'
import api from '../lib/axios'
import { useAuth } from '../context/AuthContext'

export default function Settings() {
  const { user, activeBusiness, businesses, switchBusiness, logout } = useAuth()
  const [members, setMembers] = useState([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('staff')
  const [inviting, setInviting] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState('')
  const [inviteError, setInviteError] = useState('')

  // New Business state
  const [newBizName, setNewBizName] = useState('')
  const [newBizType, setNewBizType] = useState('Retail/Kuliner')
  const [creatingBiz, setCreatingBiz] = useState(false)

  const fetchMembers = () => {
    if (!activeBusiness?.id) return
    setLoadingMembers(true)
    api.get(`/businesses/${activeBusiness.id}`)
      .then((res) => {
        setMembers(res.data.data?.members || [])
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingMembers(false))
  }

  useEffect(() => {
    fetchMembers()
  }, [activeBusiness?.id])

  const handleInvite = async (e) => {
    e.preventDefault()
    setInviteError('')
    setInviteSuccess('')
    setInviting(true)

    try {
      await api.post(`/businesses/${activeBusiness.id}/members`, {
        email: inviteEmail,
        role: inviteRole,
      })
      setInviteSuccess('Anggota berhasil ditambahkan.')
      setInviteEmail('')
      fetchMembers()
    } catch (err) {
      setInviteError(err.response?.data?.message || 'Gagal menambahkan anggota.')
    } finally {
      setInviting(false)
    }
  }

  const handleCreateBusiness = async (e) => {
    e.preventDefault()
    if (!newBizName) return
    setCreatingBiz(true)
    try {
      const res = await api.post('/businesses', {
        name: newBizName,
        type: newBizType,
      })
      alert('Usaha baru berhasil dibuat!')
      switchBusiness(res.data.data)
    } catch (err) {
      alert('Gagal membuat usaha baru.')
    } finally {
      setCreatingBiz(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Pengaturan Usaha & Akun
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Kelola profil usaha aktif, anggota tim, serta profil login Anda
        </p>
      </div>

      {/* Active Business Switcher Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Daftar Usaha Anda</h3>
              <p className="text-xs text-slate-400">Pilih usaha yang sedang aktif dikelola</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {businesses.map((biz) => {
            const isActive = String(biz.id) === String(activeBusiness?.id)
            return (
              <div
                key={biz.id}
                onClick={() => !isActive && switchBusiness(biz)}
                className={`p-3.5 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                  isActive
                    ? 'border-emerald-500 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-500'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div>
                  <div className="font-bold text-xs text-slate-800">{biz.name}</div>
                  <div className="text-[10px] text-slate-400">{biz.type || 'Usaha'} • Peran: {biz.role}</div>
                </div>
                {isActive && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    <Check className="w-3 h-3" /> Aktif
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* Create new business */}
        <form onSubmit={handleCreateBusiness} className="pt-2 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            required
            placeholder="Nama usaha cabang/baru..."
            value={newBizName}
            onChange={(e) => setNewBizName(e.target.value)}
            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
          />
          <button
            type="submit"
            disabled={creatingBiz}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition"
          >
            + Buat Usaha Baru
          </button>
        </form>
      </div>

      {/* Team Members Management */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 text-blue-800 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Anggota & Hak Akses Usaha</h3>
              <p className="text-xs text-slate-400">Undang staf atau kasir untuk input transaksi</p>
            </div>
          </div>
        </div>

        {/* Invite Form */}
        {activeBusiness?.role === 'owner' ? (
          <form onSubmit={handleInvite} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="text-xs font-bold text-slate-700">Undang Anggota Baru (Staff / Kasir):</div>
            {inviteSuccess && <div className="text-xs text-emerald-700 font-semibold">{inviteSuccess}</div>}
            {inviteError && <div className="text-xs text-red-600 font-semibold">{inviteError}</div>}
            
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                required
                placeholder="email.karyawan@kasumkm.test"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
              >
                <option value="staff">Staff / Kasir</option>
                <option value="owner">Owner Bersama</option>
              </select>
              <button
                type="submit"
                disabled={inviting}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition"
              >
                {inviting ? 'Mengundang...' : 'Undang'}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-xs text-slate-400 p-3 bg-slate-50 rounded-xl">
            Anda terdaftar sebagai <strong>Staff</strong> pada usaha ini. Penambahan anggota hanya dapat dilakukan oleh Owner.
          </div>
        )}

        {/* Members List */}
        <div className="divide-y divide-slate-100 text-xs">
          {loadingMembers ? (
            <div className="py-4 text-center text-slate-400">Memuat anggota...</div>
          ) : (
            members.map((m) => (
              <div key={m.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800">{m.name}</div>
                  <div className="text-slate-400 text-[11px]">{m.email}</div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  m.role === 'owner' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                }`}>
                  {m.role}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* User Session Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <div className="text-xs font-bold text-slate-400 uppercase">Akun Pengguna</div>
          <div className="font-bold text-slate-900 text-sm mt-0.5">{user?.name} ({user?.email})</div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar</span>
        </button>
      </div>
    </div>
  )
}

