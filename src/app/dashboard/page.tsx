'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, 
  History, 
  Send, 
  CreditCard, 
  TrendingUp, 
  Landmark, 
  Settings, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { OverviewPanel } from '@/features/dashboard/OverviewPanel';
import { LedgerPanel } from '@/features/dashboard/LedgerPanel';
import { TransfersPanel } from '@/features/dashboard/TransfersPanel';
import { CardsPanel } from '@/features/dashboard/CardsPanel';
import { InvestmentsPanel } from '@/features/dashboard/InvestmentsPanel';
import { LoansPanel } from '@/features/dashboard/LoansPanel';
import { SettingsPanel } from '@/features/dashboard/SettingsPanel';

type ViewType = 'home' | 'extrato' | 'transferencias' | 'cartoes' | 'investimentos' | 'emprestimos' | 'config';

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile, loading, signOut } = useAuth();
  const [activeView, setActiveView] = useState<ViewType>('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auth Guard redirect
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen bg-[#09090b] items-center justify-center select-none">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 rounded bg-primary flex items-center justify-center font-mono font-bold text-[#09090b] text-xl animate-pulse">
            Tl
          </div>
          <span className="text-xs font-mono tracking-widest text-zinc-500 uppercase">Sincronizando Ledger...</span>
        </div>
      </div>
    );
  }

  // Sidebar Menu Items
  const menuItems = [
    { id: 'home', label: 'Início', icon: Wallet },
    { id: 'extrato', label: 'Extrato Ledger', icon: History },
    { id: 'transferencias', label: 'Transferências / Pix', icon: Send },
    { id: 'cartoes', label: 'Cartão de Crédito', icon: CreditCard },
    { id: 'investimentos', label: 'Investimentos', icon: TrendingUp },
    { id: 'emprestimos', label: 'Empréstimos', icon: Landmark },
    { id: 'config', label: 'Configurações', icon: Settings },
  ] as const;

  return (
    <div className="flex min-h-screen bg-[#09090b] text-[#fafafa] font-sans selection:bg-primary selection:text-[#09090b] relative">
      
      {/* Mobile Top Navbar */}
      <header className="md:hidden w-full h-16 border-b border-zinc-800 bg-[#09090b]/90 backdrop-blur-md flex items-center justify-between px-6 fixed top-0 left-0 z-30">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded bg-primary flex items-center justify-center font-mono font-bold text-[#09090b] text-sm">
            Tl
          </div>
          <span className="text-sm font-bold tracking-wider text-zinc-100 uppercase">Thallium</span>
        </div>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-zinc-400 hover:text-zinc-50 focus:outline-none cursor-pointer"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Sidebar navigation */}
      <aside 
        className={`fixed md:sticky top-0 left-0 h-screen w-64 border-r border-zinc-800 bg-zinc-950 flex flex-col justify-between p-6 z-40 transform transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:block'}`}
      >
        <div className="space-y-8 mt-12 md:mt-0">
          {/* Logo brand */}
          <div className="flex items-center space-x-3 select-none">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center font-mono font-bold text-[#09090b] text-base">
              Tl
            </div>
            <span className="font-bold tracking-tight text-lg text-zinc-100">THALLIUM</span>
          </div>

          {/* Menus */}
          <nav className="flex flex-col space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveView(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`flex items-center space-x-3.5 px-3 py-2.5 rounded-[0.375rem] text-sm font-semibold tracking-normal transition-all duration-75 cursor-pointer select-none text-left w-full ${isActive ? 'bg-primary text-[#09090b] hover:bg-[#10b981]/90' : 'text-zinc-400 hover:text-zinc-50 hover:bg-zinc-900/60'}`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom profile / logout */}
        <div className="border-t border-zinc-800/60 pt-4 flex flex-col space-y-4">
          <div className="flex items-center space-x-3 select-none">
            <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-xs uppercase text-zinc-300">
              {profile?.nome ? profile.nome.charAt(0) : 'U'}
            </div>
            <div className="truncate max-w-[150px]">
              <div className="text-xs font-semibold text-zinc-200 truncate">{profile?.nome || 'Usuário'}</div>
              <div className="text-[10px] text-zinc-500 font-mono">CONTA: {profile?.cpf.slice(0, 3)}•••</div>
            </div>
          </div>

          <button
            onClick={() => {
              signOut().then(() => router.replace('/login'));
            }}
            className="flex items-center space-x-3.5 px-3 py-2.5 rounded-[0.375rem] text-sm font-semibold text-rose-500 hover:text-rose-400 hover:bg-rose-950/20 transition-all duration-75 cursor-pointer w-full text-left"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sair do Painel</span>
          </button>
        </div>
      </aside>

      {/* Backdrop overlay for mobile sidebar */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 md:hidden cursor-pointer"
        />
      )}

      {/* Main Dashboard Panel Container */}
      <main className="flex-1 min-w-0 px-6 py-12 md:px-12 mt-16 md:mt-0 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, x: -10 }}
            animate={{ 
              opacity: 1, 
              x: 0,
              transition: { type: 'spring', stiffness: 100, damping: 20 }
            }}
            exit={{ opacity: 0, x: 10, transition: { duration: 0.15 } }}
            className="w-full"
          >
            {activeView === 'home' && <OverviewPanel />}
            {activeView === 'extrato' && <LedgerPanel />}
            {activeView === 'transferencias' && <TransfersPanel />}
            {activeView === 'cartoes' && <CardsPanel />}
            {activeView === 'investimentos' && <InvestmentsPanel />}
            {activeView === 'emprestimos' && <LoansPanel />}
            {activeView === 'config' && <SettingsPanel />}
          </motion.div>
        </AnimatePresence>
      </main>

    </div>
  );
}
