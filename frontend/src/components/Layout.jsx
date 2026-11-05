import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  Wallet,
  TrendingUp,
  ReceiptText,
  Package,
  Users,
  FileSpreadsheet,
  Settings,
  PlusCircle,
  Building2,
  LogOut,
  ChevronDown,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import TransactionModal from './TransactionModal'

export default function Layout() {
  const { user, activeBusiness, businesses, switchBusiness, logout } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showBizDropdown, setShowBizDropdown] = useState(false)

  const navItems = [
    { to: '/', label: 'Dashboard', icon: TrendingUp },
    { to: '/transactions', label: 'Transaksi', icon: ReceiptText },
    { to: '/products', label: 'Produk & Stok', icon: Package },
    { to: '/contacts', label: 'Pelanggan / Pemasok', icon: Users },
    { to: '/reports', label: 'Laporan Keuangan', icon: FileSpreadsheet },
    { to: '/settings', label: 'Pengaturan Usaha', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-emerald-950 text-white flex-col justify-between p-4 shadow-xl shrink-0">
        <div className="space-y-6">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 px-2 pt-1">
            <div className="bg-emerald-500 p-2.5 rounded-2xl text-white shadow-lg shadow-emerald-500/20">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-black text-lg leading-none tracking-tight">KasUMKM</h1>
              <p className="text-[11px] text-emerald-400 font-medium mt-0.5">Keuangan UMKM Rapi</p>
            </div>
          </div>

          {/* Business Selector Pill */}
          <div className="relative">
            <div
              onClick={() => setShowBizDropdown(!showBizDropdown)}
              className="bg-emerald-900/80 p-3 rounded-xl border border-emerald-800/80 flex items-center justify-between cursor-pointer hover:bg-emerald-900 transition"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="truncate">
                  <div className="text-xs font-bold truncate">{activeBusiness?.name || 'Pilih Usaha'}</div>
                  <div className="text-[10px] text-emerald-300 capitalize">{activeBusiness?.role || 'Staff'}</div>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-emerald-400 shrink-0" />
            </div>

            {/* Dropdown list of businesses */}
            {showBizDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-emerald-900 border border-emerald-700 rounded-xl shadow-xl z-30 p-1 space-y-1">
                {businesses.map((biz) => (
                  <button
                    key={biz.id}
                    onClick={() => {
                      switchBusiness(biz)
                      setShowBizDropdown(false)
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition ${
                      String(biz.id) === String(activeBusiness?.id)
                        ? 'bg-emerald-600 text-white'
                        : 'text-emerald-100 hover:bg-emerald-800'
                    }`}
                  >
                    <div className="font-bold truncate">{biz.name}</div>
                    <div className="text-[10px] opacity-75">{biz.role}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Nav Items */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                        : 'text-emerald-200 hover:bg-emerald-900/60 hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="pt-4 border-t border-emerald-900/80 space-y-2">
          <div className="px-2">
            <div className="text-xs font-bold text-white truncate">{user?.name}</div>
            <div className="text-[11px] text-emerald-400 truncate">{user?.email}</div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-300 hover:bg-red-950/40 hover:text-red-200 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200/80 px-4 py-3 flex items-center justify-between shadow-xs sticky top-0 z-20">
          <div className="flex items-center gap-2 md:hidden">
            <div className="bg-emerald-600 p-1.5 rounded-lg text-white">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="font-black text-slate-800 text-base">KasUMKM</span>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Mode Usaha:</span>
            <span className="text-xs font-black text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md">
              {activeBusiness?.name}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Catat Transaksi</span>
            </button>
          </div>
        </header>

        {/* Body content */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full pb-20 md:pb-8">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation with Floating Center Button */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-3 py-2 flex justify-around items-center z-30 shadow-lg">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex flex-col items-center ${isActive ? 'text-emerald-600' : 'text-slate-400'}`
            }
          >
            <TrendingUp className="w-5 h-5" />
            <span className="text-[9px] mt-0.5 font-bold">Home</span>
          </NavLink>

          <NavLink
            to="/transactions"
            className={({ isActive }) =>
              `flex flex-col items-center ${isActive ? 'text-emerald-600' : 'text-slate-400'}`
            }
          >
            <ReceiptText className="w-5 h-5" />
            <span className="text-[9px] mt-0.5 font-bold">Transaksi</span>
          </NavLink>

          {/* Floating Center Action Button (FAB) */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-600 text-white p-3.5 rounded-full -mt-6 shadow-xl shadow-emerald-600/40 border-4 border-slate-50 flex items-center justify-center hover:scale-105 active:scale-95 transition"
          >
            <PlusCircle className="w-6 h-6" />
          </button>

          <NavLink
            to="/reports"
            className={({ isActive }) =>
              `flex flex-col items-center ${isActive ? 'text-emerald-600' : 'text-slate-400'}`
            }
          >
            <FileSpreadsheet className="w-5 h-5" />
            <span className="text-[9px] mt-0.5 font-bold">Laporan</span>
          </NavLink>

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex flex-col items-center ${isActive ? 'text-emerald-600' : 'text-slate-400'}`
            }
          >
            <Settings className="w-5 h-5" />
            <span className="text-[9px] mt-0.5 font-bold">Akun</span>
          </NavLink>
        </div>
      </div>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => window.location.reload()}
      />
    </div>
  )
}

