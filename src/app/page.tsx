'use client';

// Reading this as: marketing landing page for finance-conscious tech-savvy professionals, with a cinematic dark premium language, leaning toward Apple/Stripe-style typography, subtle blur orbs, infinite marquee, technical specs lists, and kinetic entrance animations.

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Cpu, CreditCard, Landmark, TrendingUp, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LandingPage() {
  const [loadingProgress, setLoadingProgress] = React.useState(0);
  const [loadingText, setLoadingText] = React.useState("INICIALIZANDO NÚCLEO TRANSAÇÃO...");
  const [preloaderActive, setPreloaderActive] = React.useState(true);
  const [mousePos, setMousePos] = React.useState({ x: -400, y: -400 });

  // 1. Preloader Progress System
  React.useEffect(() => {
    if (loadingProgress < 100) {
      const timeout = setTimeout(() => {
        const nextProgress = loadingProgress + Math.floor(Math.random() * 18) + 4;
        const finalProgress = Math.min(nextProgress, 100);
        setLoadingProgress(finalProgress);

        if (finalProgress > 85) {
          setLoadingText("ESTABELECENDO CANAL SEGURO (Tl 81)...");
        } else if (finalProgress > 55) {
          setLoadingText("ATIVANDO CRIPTOGRAFIA DE LEDGER...");
        } else if (finalProgress > 30) {
          setLoadingText("CARREGANDO ESTRUTURA ATÔMICA CONTÁBIL...");
        }
      }, 70);
      return () => clearTimeout(timeout);
    } else {
      const timeout = setTimeout(() => {
        setPreloaderActive(false);
      }, 350);
      return () => clearTimeout(timeout);
    }
  }, [loadingProgress]);

  // 2. Cursor Follower Positional Tracking
  React.useEffect(() => {
    const updateMouse = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', updateMouse);
    return () => window.removeEventListener('mousemove', updateMouse);
  }, []);

  return (
    <div className="flex-1 flex flex-col justify-between min-h-screen bg-[#090909] text-[#F5F2EB] font-sans selection:bg-gold-champagne selection:text-black-pure relative overflow-hidden">
      
      {/* Cinematic Entry Preloader */}
      <AnimatePresence>
        {preloaderActive && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }}
            className="fixed inset-0 bg-[#090909] z-50 flex flex-col items-center justify-center p-6 select-none"
          >
            <div className="flex flex-col items-center space-y-6 max-w-md w-full text-center">
              <motion.div 
                animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-deep via-gold-champagne to-gold-deep flex items-center justify-center font-display font-extrabold text-[#09090b] text-2xl shadow-[0_0_35px_rgba(212,175,106,0.35)]"
              >
                Tl
              </motion.div>
              <div className="space-y-2 w-full">
                <span className="text-3xl font-display font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-warm-white via-gold-champagne to-warm-white tracking-[0.2em] block">
                  THALLIUM
                </span>
                <span className="text-[10px] font-mono tracking-widest text-silver-metallic/60 block uppercase">
                  Atomic Operations Ledger
                </span>
              </div>
              
              {/* Progress Line */}
              <div className="w-48 bg-white/[0.04] h-[3px] rounded-full overflow-hidden border border-white/[0.06] p-[0.5px]">
                <div 
                  className="bg-gold-champagne h-full rounded-full transition-all duration-150"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
              
              <div className="space-y-1">
                <span className="text-[10px] font-mono tracking-widest text-gold-champagne block">
                  {loadingProgress}%
                </span>
                <span className="text-[8px] font-mono tracking-widest text-silver-metallic/40 uppercase block animate-pulse">
                  {loadingText}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Cursor Background Glow */}
      <div 
        className="pointer-events-none fixed w-[600px] h-[600px] rounded-full bg-gradient-to-r from-gold-champagne/[0.015] to-transparent blur-[130px] z-0 transition-transform duration-300 -translate-x-1/2 -translate-y-1/2 hidden md:block"
        style={{ left: `${mousePos.x}px`, top: `${mousePos.y}px` }}
      />

      {/* Ambient Dotted Pattern Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(212,175,106,0.018)_1.5px,transparent_1.5px)] [background-size:24px_24px] pointer-events-none z-0" />

      {/* Floating Pill Navigation Menu */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-5xl h-16 rounded-[2rem] border border-white/[0.05] bg-black-pure/45 backdrop-blur-xl z-40 flex items-center justify-between px-6 md:px-8 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
        <div className="flex items-center space-x-3 select-none">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gold-deep via-gold-champagne to-gold-deep flex items-center justify-center font-display font-extrabold text-[#09090b] text-sm shadow-[0_0_12px_rgba(212,175,106,0.2)]">
            Tl
          </div>
          <span className="font-display font-extrabold tracking-[0.2em] text-sm text-transparent bg-clip-text bg-gradient-to-r from-warm-white via-gold-champagne to-warm-white">
            THALLIUM
          </span>
        </div>
        <nav className="flex items-center space-x-6">
          <Link href="/login" className="text-xs font-bold tracking-widest uppercase text-silver-metallic hover:text-gold-champagne transition-colors duration-200">
            Entrar
          </Link>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link 
              href="/cadastro" 
              className="text-xs font-bold tracking-widest uppercase py-2 px-4.5 rounded-full bg-gradient-to-r from-gold-deep via-gold-champagne to-gold-deep text-black-pure shadow-[0_4px_15px_rgba(212,175,106,0.15)] hover:brightness-110 transition-all select-none"
            >
              Abrir Conta
            </Link>
          </motion.div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 pt-36 pb-12 flex flex-col items-center justify-center text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={preloaderActive ? {} : { opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center"
        >
          {/* Eyebrow badge */}
          <div className="inline-flex items-center space-x-2 py-1.5 px-4 rounded-full border border-gold-deep/20 bg-black-card/65 text-[10px] font-mono tracking-widest text-gold-champagne mb-8 shadow-[0_0_12px_rgba(212,175,106,0.05)] select-none">
            <span className="text-gold-champagne animate-pulse">●</span>
            <span>LIVRO-RAZÃO SISTÊMICO INTEGRADO</span>
          </div>

          <h1 className="font-display text-4xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-warm-white via-warm-white to-zinc-400 mb-8 leading-[1.1] max-w-4xl">
            A infraestrutura de contabilidade digital para o futuro financeiro.
          </h1>

          <p className="font-sans text-base md:text-lg text-silver-metallic/80 max-w-2xl mb-10 leading-relaxed font-light">
            Razão transacional de dupla entrada estruturado com consistência matemática em tempo real. Uma conta digital desenhada para operações velozes, liquidez imediata e segurança.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 w-full max-w-md mb-12">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
              <Link 
                href="/cadastro" 
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 text-xs font-bold tracking-widest uppercase py-4 px-8 rounded-full bg-gradient-to-r from-gold-deep via-gold-champagne to-gold-deep text-black-pure shadow-[0_4px_20px_rgba(212,175,106,0.2)] hover:brightness-110 hover:shadow-[0_4px_25px_rgba(212,175,106,0.3)] transition-all select-none"
              >
                <span>Abrir Conta Digital</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
              <Link 
                href="/login" 
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 text-xs font-bold tracking-widest uppercase py-4 px-8 rounded-full border border-white/[0.08] bg-black-card/45 backdrop-blur-sm text-warm-white hover:bg-black-elevated/60 hover:border-gold-deep/30 shadow-[0_4px_12px_rgba(0,0,0,0.4)] transition-all select-none"
              >
                <span>Acessar Painel</span>
              </Link>
            </motion.div>
          </div>

          {/* Interactive Atomic Orbital System (Thallium Tl 81) */}
          <div className="relative w-64 h-64 md:w-72 md:h-72 flex items-center justify-center select-none mt-2 mb-4">
            {/* Pulsing Nucleus */}
            <motion.div 
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-gold-deep via-gold-champagne to-gold-deep flex flex-col items-center justify-center text-[#09090b] shadow-[0_0_40px_rgba(212,175,106,0.4)] z-10 border border-white/20"
            >
              <span className="font-display font-extrabold text-base leading-none">Tl</span>
              <span className="font-mono text-[8px] font-bold mt-0.5 tracking-wider opacity-75">81</span>
            </motion.div>

            {/* Orbit 1 */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute w-36 h-36 rounded-full border border-white/[0.08] flex items-start justify-center"
            >
              <div className="w-2 h-2 rounded-full bg-gold-champagne shadow-[0_0_10px_rgba(212,175,106,0.8)] -mt-1" />
            </motion.div>

            {/* Orbit 2 */}
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
              className="absolute w-48 h-48 rounded-full border border-white/[0.06] flex items-center justify-between"
              style={{ transform: "rotateX(65deg) rotateY(20deg)" }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-silver-metallic shadow-[0_0_8px_rgba(184,189,199,0.7)] -ml-0.5" />
              <div className="w-1.5 h-1.5 rounded-full bg-silver-metallic shadow-[0_0_8px_rgba(184,189,199,0.7)] -mr-0.5" />
            </motion.div>

            {/* Orbit 3 */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
              className="absolute w-60 h-60 rounded-full border border-white/[0.04] flex items-end justify-center"
              style={{ transform: "rotateX(30deg) rotateY(-35deg)" }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-gold-champagne shadow-[0_0_10px_rgba(212,175,106,0.8)] -mb-0.5" />
            </motion.div>

            {/* Ambient Glow Aura */}
            <div className="absolute inset-0 bg-radial from-gold-champagne/[0.02] to-transparent blur-2xl" />
          </div>
        </motion.div>
      </main>

      {/* Infinite Horizontal Marquee */}
      <section className="w-full border-y border-white/[0.05] bg-black-card/30 backdrop-blur-xs overflow-hidden py-5 select-none relative z-10">
        <div className="flex whitespace-nowrap overflow-hidden">
          <motion.div 
            animate={{ x: [0, -1000] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="flex items-center space-x-12 pr-12 text-[10px] font-mono tracking-[0.25em] text-silver-metallic/60 font-semibold uppercase"
          >
            <span>THALLIUM LEDGER</span>
            <span className="text-gold-champagne">●</span>
            <span>CONFIANÇA MATEMÁTICA</span>
            <span className="text-gold-champagne">●</span>
            <span>ELEMENTO ATÔMICO 81</span>
            <span className="text-gold-champagne">●</span>
            <span>LIQUIDEZ OPERACIONAL ABSOLUTA</span>
            <span className="text-gold-champagne">●</span>
            <span>AUDITORIA IMUTÁVEL RLS</span>
            <span className="text-gold-champagne">●</span>
            <span>TECNOLOGIA DE CONTABILIDADE SISTÊMICA</span>
            <span className="text-gold-champagne">●</span>
            
            {/* Duplicate for seamless looping */}
            <span>THALLIUM LEDGER</span>
            <span className="text-gold-champagne">●</span>
            <span>CONFIANÇA MATEMÁTICA</span>
            <span className="text-gold-champagne">●</span>
            <span>ELEMENTO ATÔMICO 81</span>
            <span className="text-gold-champagne">●</span>
            <span>LIQUIDEZ OPERACIONAL ABSOLUTA</span>
            <span className="text-gold-champagne">●</span>
            <span>AUDITORIA IMUTÁVEL RLS</span>
            <span className="text-gold-champagne">●</span>
            <span>TECNOLOGIA DE CONTABILIDADE SISTÊMICA</span>
            <span className="text-gold-champagne">●</span>
          </motion.div>
        </div>
      </section>

      {/* Technical Protocol Rows (Portfolio Inspired) */}
      <section className="max-w-5xl w-full mx-auto px-6 py-28 relative z-10">
        <div className="section-header mb-16 text-left">
          <p className="text-[10px] tracking-[0.2em] font-mono text-gold-champagne uppercase">// ESPECIFICAÇÕES DO PROTOCOLO</p>
          <h2 className="font-display text-3xl md:text-5xl font-extrabold text-warm-white tracking-tight mt-3">
            Engenharia de Ledger Sistemática
          </h2>
        </div>

        <div className="flex flex-col border-t border-white/[0.08]">
          {[
            {
              num: "01",
              title: "CONCORDÂNCIA DE ENTRADA DUPLA",
              desc: "Isolamento contábil serializável que previne inconsistências transacionais e assegura saldo de liquidez sob concorrência paralela extrema."
            },
            {
              num: "02",
              title: "POLÍTICAS DE SEGURANÇA NO BANCO",
              desc: "Controle de acesso granular baseado em Row-Level Security (RLS) diretamente no motor PostgreSQL para isolamento completo de identidades."
            },
            {
              num: "03",
              title: "LANÇAMENTOS IMUTÁVEIS E AUDITORIA",
              desc: "Logs sequenciais de auditoria acionados por triggers nativos de banco de dados, registrando todas as movimentações e acessos sensíveis."
            },
            {
              num: "04",
              title: "RENDIMENTO DE LIQUIDEZ CORRENTE",
              desc: "Yield diário progressivo sobre títulos públicos CDB, LCI e Tesouro, com resgate e amortização contábil sob demanda imediata."
            }
          ].map((spec, i) => (
            <motion.div 
              key={i}
              whileHover={{ x: 12 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="group border-b border-white/[0.06] py-8 flex flex-col md:flex-row md:items-start justify-between gap-4 cursor-pointer"
            >
              <div className="flex items-center space-x-6 md:w-1/2">
                <span className="font-display text-2xl md:text-3xl font-extrabold text-gold-champagne/25 group-hover:text-gold-champagne transition-colors duration-300">
                  {spec.num}
                </span>
                <h3 className="font-display text-base md:text-lg font-bold text-warm-white group-hover:text-gold-champagne transition-colors duration-300 tracking-wider">
                  {spec.title}
                </h3>
              </div>
              <p className="font-sans text-sm text-silver-metallic/65 max-w-lg leading-relaxed group-hover:text-warm-white transition-colors duration-300 md:w-1/2 font-light">
                {spec.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Feature Bento Grid */}
      <section className="max-w-5xl w-full mx-auto px-6 py-12 relative z-10">
        <div className="section-header mb-16 text-left">
          <p className="text-[10px] tracking-[0.2em] font-mono text-gold-champagne uppercase">// RECURSOS OPERACIONAIS</p>
          <h2 className="font-display text-3xl md:text-5xl font-extrabold text-warm-white tracking-tight mt-3">
            Interface de Consistência
          </h2>
        </div>

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
                <p className="font-sans text-sm text-silver-metallic/70 leading-relaxed font-light">
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
                <p className="font-sans text-sm text-silver-metallic/70 leading-relaxed font-light">
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
                <p className="font-sans text-sm text-silver-metallic/70 leading-relaxed font-light">
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
                <h3 className="font-display text-lg font-bold text-warm-white mb-2">Mesa de Investimento</h3>
                <p className="font-sans text-sm text-silver-metallic/70 leading-relaxed font-light">
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
                <p className="font-sans text-sm text-silver-metallic/70 leading-relaxed font-light">
                  Transferências instantâneas Pix baseadas em chaves. Processamento assíncrono seguro com verificação de PIN de transação para controle operacional.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Cinematic Call to Action */}
      <section className="max-w-5xl w-full mx-auto px-6 py-28 relative z-10 text-center flex flex-col items-center">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 150, damping: 15 }}
          className="p-[1.5px] rounded-3xl bg-gradient-to-br from-gold-deep/30 via-black-elevated to-gold-deep/10 max-w-3xl w-full"
        >
          <div className="p-12 md:p-16 rounded-[22px] bg-black-card/80 backdrop-blur-md border border-white/[0.05] flex flex-col items-center">
            <h2 className="font-display text-3xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-warm-white via-gold-champagne to-warm-white mb-6">
              Pronto para evoluir sua gestão?
            </h2>
            <p className="font-sans text-sm text-silver-metallic/80 max-w-md mb-8 leading-relaxed font-light">
              Abra sua conta digital Thallium hoje e tenha controle absoluto sob um livro-razão de contabilidade à prova de falhas.
            </p>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link 
                href="/cadastro" 
                className="inline-flex items-center justify-center space-x-2 text-xs font-bold tracking-widest uppercase py-4 px-8 rounded-full bg-gradient-to-r from-gold-deep via-gold-champagne to-gold-deep text-black-pure shadow-[0_4px_20px_rgba(212,175,106,0.2)] hover:brightness-110 hover:shadow-[0_4px_25px_rgba(212,175,106,0.3)] transition-all select-none"
              >
                <span>Criar Conta Agora</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black-elevated bg-black-pure py-12 text-center text-xs text-silver-metallic/60 font-mono relative z-10">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
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
