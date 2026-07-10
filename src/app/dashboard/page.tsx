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
  X,
  MoreHorizontal
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
  const [showMobileMenu, setShowMobileMenu] = useState(false);

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

  // Sidebar Menu Items (desktop)
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
      
      {/* Mobile Top Navbar (app-style) */}
      <header className="md:hidden w-full h-16 border-b border-zinc-800 bg-[#09090b]/90 backdrop-blur-md flex items-center justify-between px-6 fixed top-0 left-0 z-30">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded bg-primary flex items-center justify-center font-mono font-bold text-[#09090b] text-sm">
            Tl
          </div>
          <span className="text-sm font-bold tracking-wider text-zinc-100 uppercase">Thallium</span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-300 uppercase">
            {profile?.nome ? profile.nome.charAt(0) : 'U'}
          </div>
          <button 
            onClick={() => signOut().then(() => router.replace('/login'))}
            className="text-rose-500 hover:text-rose-400 p-1.5 rounded-full hover:bg-rose-950/20 transition-colors"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Desktop Sidebar (hidden on mobile) */}
      <aside 
        className="hidden md:flex fixed md:sticky top-0 left-0 h-screen w-64 border-r border-zinc-800 bg-zinc-950 flex-col justify-between p-6 z-40"
      >
        <div className="space-y-8">
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
                  onClick={() => setActiveView(item.id)}
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

      {/* Mobile Bottom Tab Bar (app-style, fixed at the bottom) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-zinc-950/90 border-t border-zinc-800 backdrop-blur-md flex items-center justify-around z-30 px-2 pb-safe">
        <button
          onClick={() => { setActiveView('home'); setShowMobileMenu(false); }}
          className={`flex flex-col items-center justify-center w-12 h-12 transition-colors ${activeView === 'home' ? 'text-primary' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Wallet className="w-5 h-5" />
          <span className="text-[9px] font-medium mt-1">Início</span>
        </button>

        <button
          onClick={() => { setActiveView('extrato'); setShowMobileMenu(false); }}
          className={`flex flex-col items-center justify-center w-12 h-12 transition-colors ${activeView === 'extrato' ? 'text-primary' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <History className="w-5 h-5" />
          <span className="text-[9px] font-medium mt-1">Extrato</span>
        </button>

        <button
          onClick={() => { setActiveView('transferencias'); setShowMobileMenu(false); }}
          className={`flex flex-col items-center justify-center w-12 h-12 transition-colors ${activeView === 'transferencias' ? 'text-primary' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Send className="w-5 h-5" />
          <span className="text-[9px] font-medium mt-1">Transferir</span>
        </button>

        <button
          onClick={() => { setActiveView('cartoes'); setShowMobileMenu(false); }}
          className={`flex flex-col items-center justify-center w-12 h-12 transition-colors ${activeView === 'cartoes' ? 'text-primary' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <CreditCard className="w-5 h-5" />
          <span className="text-[9px] font-medium mt-1">Cartões</span>
        </button>

        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className={`flex flex-col items-center justify-center w-12 h-12 transition-colors ${showMobileMenu || ['investimentos', 'emprestimos', 'config'].includes(activeView) ? 'text-primary' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[9px] font-medium mt-1">Mais</span>
        </button>
      </nav>

      {/* Mobile "Mais" Bottom Sheet Drawer Menu overlay */}
      <AnimatePresence>
        {showMobileMenu && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileMenu(false)}
              className="md:hidden fixed inset-0 bg-black z-40"
            />
            {/* Drawer sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="md:hidden fixed bottom-16 left-0 right-0 bg-zinc-950 border-t border-zinc-800 rounded-t-2xl p-6 pb-8 z-50 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-zinc-900/50 pb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Serviços Adicionais</span>
                <button onClick={() => setShowMobileMenu(false)} className="text-zinc-500 hover:text-zinc-300">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => { setActiveView('investimentos'); setShowMobileMenu(false); }}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-colors ${activeView === 'investimentos' ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
                >
                  <TrendingUp className="w-5 h-5 mb-2" />
                  <span className="text-xs font-semibold">Investir</span>
                </button>

                <button
                  onClick={() => { setActiveView('emprestimos'); setShowMobileMenu(false); }}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-colors ${activeView === 'emprestimos' ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
                >
                  <Landmark className="w-5 h-5 mb-2" />
                  <span className="text-xs font-semibold">Empréstimos</span>
                </button>

                <button
                  onClick={() => { setActiveView('config'); setShowMobileMenu(false); }}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-colors ${activeView === 'config' ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
                >
                  <Settings className="w-5 h-5 mb-2" />
                  <span className="text-xs font-semibold">Ajustes</span>
                </button>
              </div>

              <div className="border-t border-zinc-900/50 pt-4 flex flex-col space-y-4">
                <div className="flex items-center space-x-3 select-none px-2">
                  <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-xs uppercase text-zinc-300">
                    {profile?.nome ? profile.nome.charAt(0) : 'U'}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-zinc-200">{profile?.nome || 'Usuário'}</div>
                    <div className="text-[10px] text-zinc-500 font-mono">CONTA: {profile?.cpf.slice(0, 3)}•••</div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    signOut().then(() => router.replace('/login'));
                  }}
                  className="flex items-center justify-center space-x-2 w-full py-3 rounded-xl bg-rose-950/20 border border-rose-900/25 text-sm font-semibold text-rose-500 hover:bg-rose-950/30 transition-colors"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span>Sair da Conta Corrente</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Dashboard Panel Container */}
      <main className="flex-1 min-w-0 px-4 pt-20 pb-24 md:px-12 md:py-12 overflow-y-auto">
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
