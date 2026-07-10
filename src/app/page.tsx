'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Cpu, CreditCard, Landmark } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage() {
  return (
    <div className="flex-1 flex flex-col justify-between min-h-screen bg-[#09090b] text-[#fafafa]">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center font-mono font-bold text-[#09090b] text-base select-none">
              Tl
            </div>
            <span className="font-sans font-bold tracking-tight text-lg select-none">THALLIUM</span>
          </div>
          <nav className="flex items-center space-x-6">
            <Link href="/login" className="text-sm font-medium text-zinc-400 hover:text-zinc-50 transition-colors">
              Entrar
            </Link>
            <Link 
              href="/cadastro" 
              className="text-sm font-semibold py-2 px-4 rounded-[0.375rem] bg-primary text-[#09090b] hover:bg-[#10b981]/90 transition-colors active:translate-y-[-1px]"
            >
              Criar Conta
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-20 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.6 } }}
          className="max-w-3xl flex flex-col items-center"
        >
          <div className="inline-flex items-center space-x-2 py-1 px-3 rounded-full border border-zinc-800 bg-zinc-900/50 text-xs text-primary mb-6 font-mono select-none">
            <span>●</span>
            <span>CORE LEDGER SISTEMÁTICO E SEGURO</span>
          </div>
          <h1 className="font-sans text-5xl md:text-6xl font-bold tracking-tight text-zinc-50 mb-6 leading-[1.1]">
            A infraestrutura de contabilidade digital para o futuro financeiro.
          </h1>
          <p className="font-sans text-lg text-zinc-400 max-w-2xl mb-10 leading-relaxed">
            Razão transacional de dupla entrada com consistência matemática em tempo real. Uma conta bancária estruturada para operações rápidas, gestão de ativos e liquidez absoluta.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md">
            <Link 
              href="/cadastro" 
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 text-sm font-semibold py-3 px-6 rounded-[0.375rem] bg-primary text-[#09090b] hover:bg-[#10b981]/90 transition-colors active:translate-y-[-1px]"
            >
              <span>Abrir Conta Digital</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              href="/login" 
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 text-sm font-semibold py-3 px-6 rounded-[0.375rem] border border-zinc-800 bg-transparent text-zinc-50 hover:bg-zinc-900/60 transition-colors active:translate-y-[-1px]"
            >
              <span>Acessar Painel</span>
            </Link>
          </div>
        </motion.div>

        {/* Feature Bento Grid */}
        <section className="w-full mt-32">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-left">
            <div className="p-8 rounded-lg border border-zinc-800 bg-zinc-900 md:col-span-2 flex flex-col justify-between min-h-[220px]">
              <div className="w-10 h-10 rounded bg-zinc-950 flex items-center justify-center border border-zinc-800 text-primary">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-zinc-100 mb-2">Razão Contábil Atômico</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Operações protegidas por consistência transacional profunda a nível de banco de dados. Salvaguarda absoluta contra concorrência e falhas de liquidação.
                </p>
              </div>
            </div>

            <div className="p-8 rounded-lg border border-zinc-800 bg-zinc-900 flex flex-col justify-between min-h-[220px]">
              <div className="w-10 h-10 rounded bg-zinc-950 flex items-center justify-center border border-zinc-800 text-primary">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-zinc-100 mb-2">Auditoria e Segurança</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Histórico de auditoria imutável integrado. Cada operação gera logs sequenciais auditáveis e políticas rígidas de acesso (RLS).
                </p>
              </div>
            </div>

            <div className="p-8 rounded-lg border border-zinc-800 bg-zinc-900 flex flex-col justify-between min-h-[220px]">
              <div className="w-10 h-10 rounded bg-zinc-950 flex items-center justify-center border border-zinc-800 text-primary">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-zinc-100 mb-2">Gestão de Crédito</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Configuração de cartões virtuais, limite flexível e fechamento de fatura integrado às rotinas de débito direto.
                </p>
              </div>
            </div>

            <div className="p-8 rounded-lg border border-zinc-800 bg-zinc-900 flex flex-col justify-between min-h-[220px]">
              <div className="w-10 h-10 rounded bg-zinc-950 flex items-center justify-center border border-zinc-800 text-primary">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-zinc-100 mb-2">Mesa de Investimentos</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Aplicações automáticas em títulos prefixados com taxas calculadas dinamicamente a cada fração de dia corrido.
                </p>
              </div>
            </div>

            <div className="p-8 rounded-lg border border-zinc-800 bg-zinc-900 md:col-span-3 flex flex-col justify-between min-h-[220px]">
              <div className="w-10 h-10 rounded bg-zinc-950 flex items-center justify-center border border-zinc-800 text-primary">
                <span className="font-mono font-bold text-sm">PIX</span>
              </div>
              <div>
                <h3 className="text-base font-semibold text-zinc-100 mb-2">Liquidação Instantânea</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Transferências instantâneas Pix baseadas em chaves. Processamento assíncrono seguro com verificação de PIN de transação para controle operacional.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 bg-zinc-950 py-8 text-center text-xs text-zinc-500 font-mono">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>&copy; {new Date().getFullYear()} THALLIUM INC. TODOS OS DIREITOS RESERVADOS.</span>
          <div className="flex space-x-6">
            <span className="hover:text-zinc-300 transition-colors select-none">TERMOS</span>
            <span className="hover:text-zinc-300 transition-colors select-none">PRIVACIDADE</span>
            <span className="hover:text-zinc-300 transition-colors select-none">LEDGER STATUS: ONLINE</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
