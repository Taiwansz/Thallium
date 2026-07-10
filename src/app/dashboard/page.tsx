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
      <div className="flex min-h-screen bg-[#090909] items-center justify-center select-none font-sans">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-gold-champagne flex items-center justify-center font-display font-bold text-[#090909] text-xl animate-pulse shadow-[0_0_20px_rgba(212,175,106,0.3)]">
            Tl
          </div>
          <span className="text-xs font-display tracking-widest text-silver-metallic uppercase">Sincronizando Ledger...</span>
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
    <div className="flex min-h-screen bg-[#090909] text-warm-white font-sans selection:bg-gold-champagne selection:text-[#090909] relative">
      
      {/* Mobile Top Navbar (app-style) */}
      <header className="md:hidden w-full h-16 border-b border-white/[0.06] bg-[#090909]/90 backdrop-blur-md flex items-center justify-between px-6 fixed top-0 left-0 z-30">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-gold-champagne flex items-center justify-center font-display font-bold text-[#090909] text-sm">
            Tl
          </div>
          <span className="text-sm font-bold tracking-wider text-warm-white font-display uppercase">Thallium</span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-7 h-7 rounded-full bg-[#121212] border border-white/[0.08] flex items-center justify-center text-[10px] font-bold text-silver-metallic uppercase font-display">
            {profile?.nome ? profile.nome.charAt(0) : 'U'}
          </div>
          <button 
            onClick={() => signOut().then(() => router.replace('/login'))}
            className="text-rose-500 hover:text-rose-400 p-1.5 rounded-xl hover:bg-rose-950/20 transition-colors"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Desktop Sidebar (hidden on mobile) */}
      <aside 
        className="hidden md:flex fixed md:sticky top-0 left-0 h-screen w-64 border-r border-white/[0.06] bg-[#090909] flex-col justify-between p-6 z-40"
      >
        <div className="space-y-8">
          {/* Logo brand */}
          <div className="flex items-center space-x-3 select-none">
            <div className="w-8 h-8 rounded-xl bg-gold-champagne flex items-center justify-center font-display font-bold text-[#090909] text-base shadow-[0_0_10px_rgba(212,175,106,0.2)]">
              Tl
            </div>
            <span className="font-bold tracking-wider text-lg text-warm-white font-display">THALLIUM</span>
          </div>

          {/* Menus */}
          <nav className="flex flex-col space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`flex items-center space-x-3.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 cursor-pointer select-none text-left w-full font-display ${isActive ? 'bg-gold-champagne text-black-pure font-bold hover:bg-gold-champagne/90 shadow-[0_4px_12px_rgba(212,175,106,0.15)]' : 'text-silver-metallic hover:text-gold-champagne hover:bg-white/[0.04]'}`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom profile / logout */}
        <div className="border-t border-white/[0.06] pt-4 flex flex-col space-y-4">
          <div className="flex items-center space-x-3 select-none">
            <div className="w-8 h-8 rounded-full bg-[#121212] border border-white/[0.08] flex items-center justify-center font-bold text-xs uppercase text-gold-champagne font-display">
              {profile?.nome ? profile.nome.charAt(0) : 'U'}
            </div>
            <div className="truncate max-w-[150px]">
              <div className="text-xs font-bold text-warm-white truncate font-display">{profile?.nome || 'Usuário'}</div>
              <div className="text-[10px] text-silver-metallic/60 font-mono">CONTA: {profile?.cpf.slice(0, 3)}•••</div>
            </div>
          </div>

          <button
            onClick={() => {
              signOut().then(() => router.replace('/login'));
            }}
            className="flex items-center space-x-3.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-rose-500 hover:text-rose-400 hover:bg-rose-950/20 transition-all duration-150 cursor-pointer w-full text-left font-display"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sair do Painel</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Tab Bar (app-style, fixed at the bottom) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#090909]/95 border-t border-white/[0.06] backdrop-blur-md flex items-center justify-around z-30 px-2 pb-safe">
        <button
          onClick={() => { setActiveView('home'); setShowMobileMenu(false); }}
          className={`flex flex-col items-center justify-center w-12 h-12 transition-colors duration-200 ${activeView === 'home' ? 'text-gold-champagne' : 'text-silver-metallic hover:text-warm-white'}`}
        >
          <Wallet className="w-5 h-5" />
          <span className="text-[9px] font-medium mt-1 font-display">Início</span>
        </button>

        <button
          onClick={() => { setActiveView('extrato'); setShowMobileMenu(false); }}
          className={`flex flex-col items-center justify-center w-12 h-12 transition-colors duration-200 ${activeView === 'extrato' ? 'text-gold-champagne' : 'text-silver-metallic hover:text-warm-white'}`}
        >
          <History className="w-5 h-5" />
          <span className="text-[9px] font-medium mt-1 font-display">Extrato</span>
        </button>

        <button
          onClick={() => { setActiveView('transferencias'); setShowMobileMenu(false); }}
          className={`flex flex-col items-center justify-center w-12 h-12 transition-colors duration-200 ${activeView === 'transferencias' ? 'text-gold-champagne' : 'text-silver-metallic hover:text-warm-white'}`}
        >
          <Send className="w-5 h-5" />
          <span className="text-[9px] font-medium mt-1 font-display">Transferir</span>
        </button>

        <button
          onClick={() => { setActiveView('cartoes'); setShowMobileMenu(false); }}
          className={`flex flex-col items-center justify-center w-12 h-12 transition-colors duration-200 ${activeView === 'cartoes' ? 'text-gold-champagne' : 'text-silver-metallic hover:text-warm-white'}`}
        >
          <CreditCard className="w-5 h-5" />
          <span className="text-[9px] font-medium mt-1 font-display">Cartões</span>
        </button>

        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className={`flex flex-col items-center justify-center w-12 h-12 transition-colors duration-200 ${showMobileMenu || ['investimentos', 'emprestimos', 'config'].includes(activeView) ? 'text-gold-champagne' : 'text-silver-metallic hover:text-warm-white'}`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[9px] font-medium mt-1 font-display">Mais</span>
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
              className="md:hidden fixed bottom-16 left-0 right-0 bg-[#090909] border-t border-white/[0.06] rounded-t-2xl p-6 pb-8 z-50 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-white/[0.04] pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-silver-metallic font-display">Serviços Adicionais</span>
                <button onClick={() => setShowMobileMenu(false)} className="text-silver-metallic hover:text-warm-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => { setActiveView('investimentos'); setShowMobileMenu(false); }}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-200 ${activeView === 'investimentos' ? 'bg-gold-champagne/10 border-gold-champagne/20 text-gold-champagne' : 'bg-[#121212]/50 border-white/[0.06] text-silver-metallic hover:text-warm-white'}`}
                >
                  <TrendingUp className="w-5 h-5 mb-2" />
                  <span className="text-xs font-bold font-display">Investir</span>
                </button>

                <button
                  onClick={() => { setActiveView('emprestimos'); setShowMobileMenu(false); }}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-200 ${activeView === 'emprestimos' ? 'bg-gold-champagne/10 border-gold-champagne/20 text-gold-champagne' : 'bg-[#121212]/50 border-white/[0.06] text-silver-metallic hover:text-warm-white'}`}
                >
                  <Landmark className="w-5 h-5 mb-2" />
                  <span className="text-xs font-bold font-display">Empréstimos</span>
                </button>

                <button
                  onClick={() => { setActiveView('config'); setShowMobileMenu(false); }}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-200 ${activeView === 'config' ? 'bg-gold-champagne/10 border-gold-champagne/20 text-gold-champagne' : 'bg-[#121212]/50 border-white/[0.06] text-silver-metallic hover:text-warm-white'}`}
                >
                  <Settings className="w-5 h-5 mb-2" />
                  <span className="text-xs font-bold font-display">Ajustes</span>
                </button>
              </div>

              <div className="border-t border-white/[0.04] pt-4 flex flex-col space-y-4">
                <div className="flex items-center space-x-3 select-none px-2">
                  <div className="w-8 h-8 rounded-full bg-[#121212] border border-white/[0.08] flex items-center justify-center font-bold text-xs uppercase text-gold-champagne font-display">
                    {profile?.nome ? profile.nome.charAt(0) : 'U'}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-warm-white font-display">{profile?.nome || 'Usuário'}</div>
                    <div className="text-[10px] text-silver-metallic/60 font-mono">CONTA: {profile?.cpf.slice(0, 3)}•••</div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    signOut().then(() => router.replace('/login'));
                  }}
                  className="flex items-center justify-center space-x-2 w-full py-3.5 rounded-xl bg-rose-950/20 border border-rose-900/25 text-sm font-semibold text-rose-500 hover:bg-rose-950/30 transition-colors font-display"
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

