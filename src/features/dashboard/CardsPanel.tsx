'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { formatCurrency, formatCardNumber } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { Lock, Unlock, Eye, EyeOff, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

interface Cartao {
  id: string;
  numero: string;
  validade: string;
  cvv: string;
  id_cliente: string;
  bloqueado: boolean;
  limite_total: number;
  limite_usado: number;
  fatura_fechada: boolean;
  data_vencimento: string;
}

export function CardsPanel() {
  const { profile, conta, refreshConta } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [showCardDetails, setShowCardDetails] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Interactive Card Physics state
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [shineX, setShineX] = useState(50);
  const [shineY, setShineY] = useState(50);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const cardEl = e.currentTarget;
    const rect = cardEl.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Specular shine coordinates (percentages)
    setShineX((x / rect.width) * 100);
    setShineY((y / rect.height) * 100);
    
    // Tilt calculations (-12 to 12 deg)
    const rx = -((y - rect.height / 2) / (rect.height / 2)) * 12;
    const ry = ((x - rect.width / 2) / (rect.width / 2)) * 12;
    setRotateX(rx);
    setRotateY(ry);
  };

  const handleMouseLeave = () => {
    // Reset to center
    setRotateX(0);
    setRotateY(0);
    setShineX(50);
    setShineY(50);
  };

  // Fetch cards
  const { data: cards, isLoading } = useQuery<Cartao[]>({
    queryKey: ['clientCards', profile?.id_cliente],
    queryFn: async () => {
      if (!profile) return [];
      const { data, error } = await supabase
        .from('cartoes')
        .select('*')
        .eq('id_cliente', profile.id_cliente);
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile,
  });

  const card = cards?.[0];

  // Block or unblock card
  const toggleBlockCard = async () => {
    if (!card) return;
    try {
      const { error } = await supabase
        .from('cartoes')
        .update({ bloqueado: !card.bloqueado })
        .eq('id', card.id);

      if (error) throw error;
      
      toast(card.bloqueado ? 'Cartão desbloqueado com sucesso!' : 'Cartão bloqueado com sucesso!', 'success');
      queryClient.invalidateQueries({ queryKey: ['clientCards'] });
    } catch (err: any) {
      toast(err.message || 'Erro ao alterar estado do cartão.', 'error');
    }
  };

  // Pay invoice
  const handlePayInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!card || !conta) return;

    const val = parseFloat(payAmount);
    if (isNaN(val) || val <= 0) {
      toast('Insira um valor de pagamento válido.', 'error');
      return;
    }

    if (val > card.limite_usado) {
      toast('O valor inserido excede o limite usado atual.', 'error');
      return;
    }

    if (conta.saldo < val) {
      toast('Saldo em conta insuficiente para pagar esta fatura.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.rpc('pagar_fatura', {
        p_id_cartao: card.id,
        p_valor: val,
      });

      if (error) throw error;

      toast('Pagamento da fatura confirmado!', 'success');
      setPayAmount('');
      setPayModalOpen(false);
      await refreshConta();
      queryClient.invalidateQueries({ queryKey: ['clientCards'] });
      queryClient.invalidateQueries({ queryKey: ['recentTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['ledgerTransactions'] });
    } catch (err: any) {
      toast(err.message || 'Erro ao efetuar pagamento de fatura.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col space-y-4 max-w-5xl">
        <div className="h-6 w-48 bg-white/[0.04] rounded animate-pulse" />
        <div className="h-52 max-w-[340px] bg-white/[0.02] rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!card) {
    return (
      <div className="text-sm text-silver-metallic font-sans">
        Nenhum cartão habilitado neste perfil contábil.
      </div>
    );
  }

  const limiteDisponivel = card.limite_total - card.limite_usado;
  const percentageUsed = (card.limite_usado / card.limite_total) * 100;

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h2 className="text-xl font-bold tracking-wide text-warm-white font-display">Cartão de Crédito Thallium</h2>
        <p className="text-xs text-silver-metallic/70 font-sans mt-1">
          Painel de controle para cartões virtuais e limites operacionais.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Virtual Card Widget */}
        <div className="md:col-span-1 flex flex-col items-center md:items-start">
          <div className="perspective-[1000px] w-full max-w-[340px]">
            <motion.div
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              animate={{ rotateX, rotateY }}
              transition={{ type: 'spring', stiffness: 220, damping: 22 }}
              style={{ transformStyle: 'preserve-3d' }}
              className={`relative h-52 w-full rounded-2xl p-6 flex flex-col justify-between overflow-hidden transition-all duration-300 border border-white/[0.08] shadow-2xl shadow-black/80 group select-none ${
                card.bloqueado 
                  ? 'bg-gradient-to-br from-[#121212] to-[#0a0a0a] opacity-55' 
                  : 'bg-gradient-to-br from-[#18181a] via-[#201c15] to-[#0c0c0d]'
              }`}
            >
              {/* Dynamic glossy specular light effect */}
              {!card.bloqueado && (
                <div 
                  className="absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay transition-opacity duration-300 group-hover:opacity-75"
                  style={{
                    background: `radial-gradient(circle at ${shineX}% ${shineY}%, rgba(255, 255, 255, 0.45) 0%, transparent 55%)`
                  }}
                />
              )}

              {/* Specular metallic gold noise sheen */}
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-color-dodge"
                style={{
                  backgroundImage: `radial-gradient(circle, #D4AF6A 1px, transparent 1px)`,
                  backgroundSize: '8px 8px'
                }}
              />

              {/* Top Header Card */}
              <div className="flex items-center justify-between" style={{ transform: 'translateZ(20px)' }}>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-gold-champagne flex items-center justify-center font-display font-extrabold text-black-pure text-sm shadow-[0_0_12px_rgba(212,175,106,0.3)]">
                    Tl
                  </div>
                  <span className="text-[10px] font-bold font-display tracking-widest text-gold-champagne">THALLIUM</span>
                </div>
                <span className="text-[9px] font-mono tracking-widest text-silver-metallic/60">METAL BLACK</span>
              </div>

              {/* Chip and Contactless Wave */}
              <div className="flex items-center space-x-4 my-1" style={{ transform: 'translateZ(25px)' }}>
                {/* Metallic Holographic Chip */}
                <div className="w-10 h-7 rounded-md bg-gradient-to-br from-[#E2C799] via-[#C39B62] to-[#B08447] opacity-90 relative border border-white/20 shadow-[inset_0_1px_3px_rgba(255,255,255,0.4)] overflow-hidden">
                  <div className="absolute inset-x-3 inset-y-0 border-l border-r border-[#966b33]/40" />
                  <div className="absolute inset-y-2 inset-x-0 border-t border-b border-[#966b33]/40" />
                  <div className="absolute w-2 h-2 rounded-full bg-[#E2C799] top-2.5 left-4 opacity-50" />
                </div>
                {/* Contactless Wave symbol */}
                <svg className="w-5 h-5 text-silver-metallic/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 17.5c2-2.5 2-6.5 0-9M8 20c4-4 4-10 0-14M11 22.5c6-6 6-15 0-21" strokeLinecap="round" />
                </svg>
              </div>

              <div className="space-y-3" style={{ transform: 'translateZ(30px)' }}>
                {/* Card number */}
                <div className="text-lg font-mono tracking-widest text-warm-white tabular-nums">
                  {showCardDetails ? formatCardNumber(card.numero) : `•••• •••• •••• ${card.numero.slice(-4)}`}
                </div>

                {/* Validity and CVV */}
                <div className="flex justify-between items-center text-xs font-mono">
                  <div>
                    <div className="text-[8px] text-silver-metallic/50 uppercase">VALIDADE</div>
                    <div className="text-warm-white font-semibold">{card.validade}</div>
                  </div>
                  <div>
                    <div className="text-[8px] text-silver-metallic/50 uppercase">CVV</div>
                    <div className="text-warm-white font-semibold">{showCardDetails ? card.cvv : '•••'}</div>
                  </div>
                </div>
              </div>

              {/* Holder Name */}
              <div className="flex items-center justify-between" style={{ transform: 'translateZ(15px)' }}>
                <span className="text-[9px] font-display font-semibold tracking-wider text-silver-metallic truncate uppercase max-w-[200px]">
                  {profile?.nome || 'TITULAR DO CARTÃO'}
                </span>
                {card.bloqueado ? (
                  <span className="text-[8px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-lg border border-rose-500/25 font-display tracking-wider">
                    BLOQUEADO
                  </span>
                ) : (
                  <span className="text-[8px] font-bold text-gold-champagne bg-gold-champagne/10 px-2 py-0.5 rounded-lg border border-gold-champagne/25 font-display tracking-wider">
                    ATIVO
                  </span>
                )}
              </div>
            </motion.div>
          </div>

          {/* Visibility Controls */}
          <div className="mt-4 flex gap-3 w-full max-w-[340px]">
            <Button
              variant="secondary"
              className="flex-1 text-xs py-2.5 px-3 cursor-pointer rounded-xl font-display font-semibold"
              onClick={() => setShowCardDetails(!showCardDetails)}
            >
              {showCardDetails ? <EyeOff className="w-3.5 h-3.5 mr-2 text-silver-metallic" /> : <Eye className="w-3.5 h-3.5 mr-2 text-silver-metallic" />}
              <span>{showCardDetails ? 'Ocultar' : 'Revelar dados'}</span>
            </Button>

            <Button
              variant="secondary"
              className="flex-1 text-xs py-2.5 px-3 cursor-pointer rounded-xl font-display font-semibold"
              onClick={toggleBlockCard}
            >
              {card.bloqueado ? <Unlock className="w-3.5 h-3.5 mr-2 text-gold-champagne" /> : <Lock className="w-3.5 h-3.5 mr-2 text-rose-500" />}
              <span>{card.bloqueado ? 'Desbloquear' : 'Bloquear'}</span>
            </Button>
          </div>
        </div>

        {/* Credit Limit & Invoice Widget */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border border-white/[0.06] p-2">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-silver-metallic font-display">Limites e Fatura</CardTitle>
              <CardDescription>Acompanhe o consumo e realize a liquidação do saldo de fatura.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progress limit bar */}
              <div className="space-y-2.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-silver-metallic/60">CONSUMIDO: {formatCurrency(card.limite_usado)}</span>
                  <span className="text-warm-white">DISPONÍVEL: {formatCurrency(limiteDisponivel)}</span>
                </div>
                <div className="w-full bg-black-pure h-2.5 rounded-full overflow-hidden border border-white/[0.06] p-[1px]">
                  <div 
                    className="bg-gradient-to-r from-gold-deep to-gold-champagne h-full rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(212,175,106,0.3)]" 
                    style={{ width: `${Math.min(percentageUsed, 100)}%` }}
                  />
                </div>
                <div className="text-[10px] text-silver-metallic/50 text-right font-mono">
                  LIMITE TOTAL: {formatCurrency(card.limite_total)}
                </div>
              </div>

              {/* Card invoice Details */}
              <div className="border-t border-white/[0.05] pt-5 flex items-center justify-between">
                <div>
                  <div className="text-xs text-silver-metallic/50 font-mono">FATURA ATUAL</div>
                  <div className="text-2xl font-bold font-mono text-warm-white mt-1 tabular-nums">
                    {formatCurrency(card.limite_usado)}
                  </div>
                </div>

                <Button 
                  disabled={card.limite_usado <= 0}
                  onClick={() => setPayModalOpen(true)}
                  className="cursor-pointer"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  <span>Pagar Fatura</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pay Invoice Modal */}
      <Modal
        isOpen={payModalOpen}
        onClose={() => { setPayModalOpen(false); setPayAmount(''); }}
        title="Liquidação de Fatura"
      >
        <form onSubmit={handlePayInvoice} className="space-y-4">
          <div className="bg-black-pure/80 p-4 rounded-xl border border-white/[0.06] space-y-2.5 font-mono text-xs text-silver-metallic/70">
            <div className="flex justify-between">
              <span>SALDO EM CONTA:</span>
              <strong className="text-gold-champagne font-bold">{conta ? formatCurrency(conta.saldo) : 'R$ 0,00'}</strong>
            </div>
            <div className="flex justify-between">
              <span>DÉBITO ATUAL DO CARTÃO:</span>
              <strong className="text-warm-white font-bold">{formatCurrency(card.limite_usado)}</strong>
            </div>
          </div>

          <Input
            label="Valor do Pagamento (R$)"
            type="number"
            step="0.01"
            placeholder="0,00"
            required
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
            disabled={isSubmitting}
          />

          <div className="flex justify-end gap-3 mt-6">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => { setPayModalOpen(false); setPayAmount(''); }}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Confirmar Pagamento
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

