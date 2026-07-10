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
import { Lock, Unlock, Eye, EyeOff, FileText, CheckCircle2 } from 'lucide-react';

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
    return <div className="text-sm text-zinc-400 animate-pulse">Carregando gerenciamento de cartões...</div>;
  }

  if (!card) {
    return (
      <div className="text-sm text-zinc-500 font-sans">
        Nenhum cartão habilitado neste perfil contábil.
      </div>
    );
  }

  const limiteDisponivel = card.limite_total - card.limite_usado;
  const percentageUsed = (card.limite_usado / card.limite_total) * 100;

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-zinc-100 font-sans">Cartão de Crédito Thallium</h2>
        <p className="text-xs text-zinc-400 font-sans mt-0.5">
          Painel de controle para cartões virtuais e limites operacionais.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Virtual Card Widget */}
        <div className="md:col-span-1">
          <div className={`relative h-52 w-full max-w-[320px] rounded-xl p-6 flex flex-col justify-between overflow-hidden transition-all duration-300 border border-zinc-800 ${card.bloqueado ? 'bg-zinc-950 opacity-60' : 'bg-gradient-to-br from-zinc-900 to-zinc-950'}`}>
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded bg-primary flex items-center justify-center font-mono font-bold text-[#09090b] text-xs">
                Tl
              </div>
              <span className="text-[10px] font-mono tracking-widest text-zinc-500">CORPORATE</span>
            </div>

            <div className="space-y-4">
              {/* Card number */}
              <div className="text-lg font-mono tracking-widest text-zinc-100 tabular-nums">
                {showCardDetails ? formatCardNumber(card.numero) : `•••• •••• •••• ${card.numero.slice(-4)}`}
              </div>

              {/* Validity and CVV */}
              <div className="flex justify-between items-center text-xs font-mono">
                <div>
                  <div className="text-[9px] text-zinc-500">VALIDADE</div>
                  <div className="text-zinc-300">{card.validade}</div>
                </div>
                <div>
                  <div className="text-[9px] text-zinc-500">CVV</div>
                  <div className="text-zinc-300">{showCardDetails ? card.cvv : '•••'}</div>
                </div>
              </div>
            </div>

            {/* Holder Name */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono tracking-wider text-zinc-400 truncate uppercase">
                {profile?.nome || 'TITULAR DO CARTÃO'}
              </span>
              {card.bloqueado && (
                <span className="text-[9px] font-semibold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded font-mono">
                  BLOQUEADO
                </span>
              )}
            </div>
          </div>

          {/* Visibility Controls */}
          <div className="mt-4 flex gap-3 max-w-[320px]">
            <Button
              variant="secondary"
              className="flex-1 text-xs py-2 px-3 cursor-pointer"
              onClick={() => setShowCardDetails(!showCardDetails)}
            >
              {showCardDetails ? <EyeOff className="w-3.5 h-3.5 mr-2" /> : <Eye className="w-3.5 h-3.5 mr-2" />}
              <span>{showCardDetails ? 'Ocultar' : 'Revelar dados'}</span>
            </Button>

            <Button
              variant="secondary"
              className="flex-1 text-xs py-2 px-3 cursor-pointer"
              onClick={toggleBlockCard}
            >
              {card.bloqueado ? <Unlock className="w-3.5 h-3.5 mr-2 text-primary" /> : <Lock className="w-3.5 h-3.5 mr-2 text-rose-500" />}
              <span>{card.bloqueado ? 'Desbloquear' : 'Bloquear'}</span>
            </Button>
          </div>
        </div>

        {/* Credit Limit & Invoice Widget */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Limites e Fatura</CardTitle>
              <CardDescription>Acompanhe o consumo e realize a liquidação do saldo de fatura.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progress limit bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-500">CONSUMIDO: {formatCurrency(card.limite_usado)}</span>
                  <span className="text-zinc-300">DISPONÍVEL: {formatCurrency(limiteDisponivel)}</span>
                </div>
                <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-850">
                  <div 
                    className="bg-primary h-full transition-all duration-500" 
                    style={{ width: `${Math.min(percentageUsed, 100)}%` }}
                  />
                </div>
                <div className="text-[10px] text-zinc-500 text-right font-mono">
                  LIMITE TOTAL: {formatCurrency(card.limite_total)}
                </div>
              </div>

              {/* Card invoice Details */}
              <div className="border-t border-zinc-800 pt-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-zinc-500 font-mono">FATURA ATUAL</div>
                  <div className="text-2xl font-bold font-mono text-zinc-100 mt-1 tabular-nums">
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
          <div className="bg-zinc-950/60 p-4 rounded border border-zinc-850 space-y-2 font-mono text-xs text-zinc-400">
            <div className="flex justify-between">
              <span>SALDO EM CONTA:</span>
              <strong className="text-primary">{conta ? formatCurrency(conta.saldo) : 'R$ 0,00'}</strong>
            </div>
            <div className="flex justify-between">
              <span>DÉBITO ATUAL DO CARTÃO:</span>
              <strong className="text-zinc-200">{formatCurrency(card.limite_usado)}</strong>
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
