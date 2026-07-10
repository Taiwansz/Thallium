'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Cpu, CreditCard, Landmark } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage() {
  return (
    <div className="flex-1 flex flex-col justify-between min-h-screen bg-[#09090b] text-[#fafafa] font-sans selection:bg-gold-champagne selection:text-black-pure">
      {/* Header */}
      <header className="border-b border-black-elevated bg-black-pure/70 backdrop-blur-md sticky top-0 z-40 shadow-[0_1px_0_0_rgba(212,175,106,0.05)]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-deep via-gold-champagne to-gold-deep flex items-center justify-center font-display font-extrabold text-[#09090b] text-base shadow-[0_4px_16px_rgba(212,175,106,0.25)] select-none">
              Tl
            </div>
            <span className="font-display font-extrabold tracking-widest text-lg text-transparent bg-clip-text bg-gradient-to-r from-warm-white via-gold-champagne to-warm-white select-none">
              THALLIUM
            </span>
          </div>
          <nav className="flex items-center space-x-6">
            <Link href="/login" className="text-sm font-semibold text-silver-metallic hover:text-gold-champagne transition-colors duration-200">
              Entrar
            </Link>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link 
                href="/cadastro" 
                className="text-sm font-bold py-2.5 px-5 rounded-[1.25rem] bg-gradient-to-r from-gold-deep via-gold-champagne to-gold-deep text-black-pure shadow-[0_4px_15px_rgba(212,175,106,0.15)] hover:brightness-110 transition-all select-none"
              >
                Criar Conta
              </Link>
            </motion.div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-24 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }}
          className="max-w-3xl flex flex-col items-center"
        >
          <div className="inline-flex items-center space-x-2 py-1.5 px-4 rounded-full border border-gold-deep/20 bg-black-card/65 text-xs text-gold-champagne mb-8 font-mono shadow-[0_0_12px_rgba(212,175,106,0.05)] select-none">
            <span className="text-gold-champagne animate-pulse">●</span>
            <span>CORE LEDGER SISTEMÁTICO E SEGURO</span>
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-warm-white via-warm-white to-zinc-400 mb-8 leading-[1.1] md:leading-[1.15]">
            A infraestrutura de contabilidade digital para o futuro financeiro.
          </h1>
          <p className="font-sans text-lg md:text-xl text-silver-metallic/90 max-w-2xl mb-12 leading-relaxed">
            Razão transacional de dupla entrada com consistência matemática em tempo real. Uma conta bancária estruturada para operações rápidas, gestão de ativos e liquidez absoluta.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 w-full max-w-lg">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
              <Link 
                href="/cadastro" 
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 text-sm font-bold py-4 px-8 rounded-[1.25rem] bg-gradient-to-r from-gold-deep via-gold-champagne to-gold-deep text-black-pure shadow-[0_4px_20px_rgba(212,175,106,0.2)] hover:brightness-110 hover:shadow-[0_4px_25px_rgba(212,175,106,0.3)] transition-all select-none"
              >
                <span>Abrir Conta Digital</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
              <Link 
                href="/login" 
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 text-sm font-semibold py-4 px-8 rounded-[1.25rem] border border-black-elevated bg-black-card/45 backdrop-blur-sm text-warm-white hover:bg-black-elevated/60 hover:border-gold-deep/30 shadow-[0_4px_12px_rgba(0,0,0,0.4)] transition-all select-none"
              >
                <span>Acessar Painel</span>
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Feature Bento Grid */}
        <section className="w-full mt-36">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-left">
            {/* Card 1 */}
            <motion.div 
              whileHover={{ y: -6, scale: 1.01, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
              whileTap={{ scale: 0.99 }}
              className="p-[1.5px] rounded-3xl bg-gradient-to-b from-gold-deep/20 via-black-elevated to-black-elevated md:col-span-2 shadow-[0_12px_32px_rgba(0,0,0,0.5)]"
            >
              <div className="p-8 rounded-[23px] border border-black-elevated bg-black-card/85 backdrop-blur-md flex flex-col justify-between min-h-[240px] h-full">
                <div className="w-12 h-12 rounded-2xl bg-[#09090b] flex items-center justify-center border border-gold-deep/20 text-gold-champagne shadow-[0_4px_12px_rgba(212,175,106,0.1)]">
                  <Cpu className="w-5 h-5" />
                </div>
                <div className="mt-6">
                  <h3 className="font-display text-lg font-bold text-warm-white mb-2">Razão Contábil Atômico</h3>
                  <p className="font-sans text-sm text-silver-metallic leading-relaxed">
                    Operações protegidas por consistência transacional profunda a nível de banco de dados. Salvaguarda absoluta contra concorrência e falhas de liquidação.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Card 2 */}
            <motion.div 
              whileHover={{ y: -6, scale: 1.01, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
              whileTap={{ scale: 0.99 }}
              className="p-[1.5px] rounded-3xl bg-gradient-to-b from-gold-deep/20 via-black-elevated to-black-elevated shadow-[0_12px_32px_rgba(0,0,0,0.5)]"
            >
              <div className="p-8 rounded-[23px] border border-black-elevated bg-black-card/85 backdrop-blur-md flex flex-col justify-between min-h-[240px] h-full">
                <div className="w-12 h-12 rounded-2xl bg-[#09090b] flex items-center justify-center border border-gold-deep/20 text-gold-champagne shadow-[0_4px_12px_rgba(212,175,106,0.1)]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="mt-6">
                  <h3 className="font-display text-lg font-bold text-warm-white mb-2">Auditoria e Segurança</h3>
                  <p className="font-sans text-sm text-silver-metallic leading-relaxed">
                    Histórico de auditoria imutável integrado. Cada operação gera logs sequenciais auditáveis e políticas rígidas de acesso (RLS).
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Card 3 */}
            <motion.div 
              whileHover={{ y: -6, scale: 1.01, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
              whileTap={{ scale: 0.99 }}
              className="p-[1.5px] rounded-3xl bg-gradient-to-b from-gold-deep/20 via-black-elevated to-black-elevated shadow-[0_12px_32px_rgba(0,0,0,0.5)]"
            >
              <div className="p-8 rounded-[23px] border border-black-elevated bg-black-card/85 backdrop-blur-md flex flex-col justify-between min-h-[240px] h-full">
                <div className="w-12 h-12 rounded-2xl bg-[#09090b] flex items-center justify-center border border-gold-deep/20 text-gold-champagne shadow-[0_4px_12px_rgba(212,175,106,0.1)]">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="mt-6">
                  <h3 className="font-display text-lg font-bold text-warm-white mb-2">Gestão de Crédito</h3>
                  <p className="font-sans text-sm text-silver-metallic leading-relaxed">
                    Configuração de cartões virtuais, limite flexível e fechamento de fatura integrado às rotinas de débito direto.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Card 4 */}
            <motion.div 
              whileHover={{ y: -6, scale: 1.01, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
              whileTap={{ scale: 0.99 }}
              className="p-[1.5px] rounded-3xl bg-gradient-to-b from-gold-deep/20 via-black-elevated to-black-elevated shadow-[0_12px_32px_rgba(0,0,0,0.5)]"
            >
              <div className="p-8 rounded-[23px] border border-black-elevated bg-black-card/85 backdrop-blur-md flex flex-col justify-between min-h-[240px] h-full">
                <div className="w-12 h-12 rounded-2xl bg-[#09090b] flex items-center justify-center border border-gold-deep/20 text-gold-champagne shadow-[0_4px_12px_rgba(212,175,106,0.1)]">
                  <Landmark className="w-5 h-5" />
                </div>
                <div className="mt-6">
                  <h3 className="font-display text-lg font-bold text-warm-white mb-2">Mesa de Investimentos</h3>
                  <p className="font-sans text-sm text-silver-metallic leading-relaxed">
                    Aplicações automáticas em títulos prefixados com taxas calculadas dinamicamente a cada fração de dia corrido.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Card 5 */}
            <motion.div 
              whileHover={{ y: -6, scale: 1.01, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
              whileTap={{ scale: 0.99 }}
              className="p-[1.5px] rounded-3xl bg-gradient-to-b from-gold-deep/20 via-black-elevated to-black-elevated md:col-span-3 shadow-[0_12px_32px_rgba(0,0,0,0.5)]"
            >
              <div className="p-8 rounded-[23px] border border-black-elevated bg-black-card/85 backdrop-blur-md flex flex-col justify-between min-h-[240px] h-full">
                <div className="w-12 h-12 rounded-2xl bg-[#09090b] flex items-center justify-center border border-gold-deep/20 text-gold-champagne shadow-[0_4px_12px_rgba(212,175,106,0.1)]">
                  <span className="font-display font-extrabold text-sm tracking-wide">PIX</span>
                </div>
                <div className="mt-6">
                  <h3 className="font-display text-lg font-bold text-warm-white mb-2">Liquidação Instantânea</h3>
                  <p className="font-sans text-sm text-silver-metallic leading-relaxed">
                    Transferências instantâneas Pix baseadas em chaves. Processamento assíncrono seguro com verificação de PIN de transação para controle operacional.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-black-elevated bg-[#09090b] py-10 text-center text-xs text-silver-metallic/60 font-mono">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>&copy; {new Date().getFullYear()} THALLIUM INC. TODOS OS DIREITOS RESERVADOS.</span>
          <div className="flex space-x-6">
            <span className="hover:text-gold-champagne cursor-pointer transition-colors duration-200">TERMOS</span>
            <span className="hover:text-gold-champagne cursor-pointer transition-colors duration-200">PRIVACIDADE</span>
            <span className="hover:text-gold-champagne transition-colors duration-200 flex items-center gap-1.5 select-none">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              LEDGER STATUS: ONLINE
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
