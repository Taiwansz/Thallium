'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { formatCurrency, formatCPF } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { ArrowUpRight, ArrowDownLeft, Plus, Minus, Smartphone, FileText } from 'lucide-react';

interface Transaction {
  id_transacao: string;
  numero_conta: number;
  tipo_transacao: string;
  valor: number;
  data_transacao: string;
  descricao: string;
  categoria: string;
}

export function OverviewPanel() {
  const { profile, conta, refreshConta } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Modals state
  const [modalType, setModalType] = useState<'deposit' | 'withdraw' | 'boleto' | 'recharge' | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [targetCode, setTargetCode] = useState(''); // barcode or phone number
  const [operator, setOperator] = useState('Vivo'); // for recharge
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch recent transactions (last 5)
  const { data: recentTransactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ['recentTransactions', conta?.numero_conta],
    queryFn: async () => {
      if (!conta) return [];
      const { data, error } = await supabase
        .from('transacoes')
        .select('*')
        .eq('numero_conta', conta.numero_conta)
        .order('data_transacao', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
    enabled: !!conta,
  });

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conta || !profile) return;

    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      toast('Insira um valor numérico válido maior que zero.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (modalType === 'deposit') {
        const { error } = await supabase.rpc('realizar_deposito', {
          p_valor: val,
          p_descricao: description || 'Depósito direto',
        });
        if (error) throw error;
        toast('Depósito efetuado com sucesso!', 'success');
      } else if (modalType === 'withdraw') {
        const { error } = await supabase.rpc('realizar_saque', {
          p_valor: val,
          p_descricao: description || 'Saque em espécie',
        });
        if (error) throw error;
        toast('Saque efetuado com sucesso!', 'success');
      } else if (modalType === 'boleto') {
        if (!targetCode) {
          toast('Código de barras do boleto é obrigatório.', 'error');
          setIsSubmitting(false);
          return;
        }
        const { error } = await supabase.rpc('pagar_boleto', {
          p_valor: val,
          p_cod_barras: targetCode,
        });
        if (error) throw error;
        toast('Boleto pago com sucesso!', 'success');
      } else if (modalType === 'recharge') {
        if (!targetCode) {
          toast('Número de telefone é obrigatório.', 'error');
          setIsSubmitting(false);
          return;
        }
        const { error } = await supabase.rpc('realizar_recarga', {
          p_valor: val,
          p_operadora: operator,
          p_telefone: targetCode,
        });
        if (error) throw error;
        toast('Recarga de celular realizada!', 'success');
      }

      // Cleanup & Refresh
      setAmount('');
      setDescription('');
      setTargetCode('');
      setModalType(null);
      await refreshConta();
      queryClient.invalidateQueries({ queryKey: ['recentTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['ledgerTransactions'] });
    } catch (err: any) {
      toast(err.message || 'Erro ao processar transação.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Account Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Balance Card */}
        <Card className="md:col-span-2 flex flex-col justify-between p-2">
          <CardHeader className="pb-2">
            <CardDescription>
              Saldo em Conta Corrente
            </CardDescription>
            <CardTitle className="text-4xl md:text-5xl font-display tracking-tight font-bold text-gold-champagne tabular-nums mt-2">
              {conta ? formatCurrency(conta.saldo) : 'R$ 0,00'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center text-xs text-silver-metallic/60 font-mono mt-4">
              <span>CONTA AGÊNCIA: 0001</span>
              <span className="mx-2 text-white/10">•</span>
              <span>NÚMERO: {conta?.numero_conta || '------'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Profile Card */}
        <Card className="flex flex-col justify-between p-2">
          <CardHeader className="pb-2">
            <CardDescription>
              Titular do Razão
            </CardDescription>
            <CardTitle className="text-lg font-bold font-display text-warm-white truncate mt-2">
              {profile?.nome || 'Cliente Thallium'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xs text-silver-metallic/60 font-mono space-y-1 mt-4">
              <div>CPF: {profile ? formatCPF(profile.cpf) : '-----------'}</div>
              <div className="truncate">E-MAIL: {profile?.email || '---------'}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Panel */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-silver-metallic font-display mb-4">
          Ações Rápidas de Caixa
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <button 
            className="flex flex-col items-center justify-center p-6 h-24 rounded-2xl border border-white/[0.06] bg-[#121212]/50 hover:bg-[#121212] hover:border-gold-champagne/30 text-warm-white transition-all duration-200 active:scale-[0.97] cursor-pointer shadow-lg shadow-black/30 font-display group"
            onClick={() => setModalType('deposit')}
          >
            <Plus className="w-5 h-5 mb-2 text-gold-champagne group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-silver-metallic group-hover:text-warm-white transition-colors">Depositar</span>
          </button>

          <button 
            className="flex flex-col items-center justify-center p-6 h-24 rounded-2xl border border-white/[0.06] bg-[#121212]/50 hover:bg-[#121212] hover:border-gold-champagne/30 text-warm-white transition-all duration-200 active:scale-[0.97] cursor-pointer shadow-lg shadow-black/30 font-display group"
            onClick={() => setModalType('withdraw')}
          >
            <Minus className="w-5 h-5 mb-2 text-rose-500 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-silver-metallic group-hover:text-warm-white transition-colors">Sacar</span>
          </button>

          <button 
            className="flex flex-col items-center justify-center p-6 h-24 rounded-2xl border border-white/[0.06] bg-[#121212]/50 hover:bg-[#121212] hover:border-gold-champagne/30 text-warm-white transition-all duration-200 active:scale-[0.97] cursor-pointer shadow-lg shadow-black/30 font-display group"
            onClick={() => setModalType('boleto')}
          >
            <FileText className="w-5 h-5 mb-2 text-silver-metallic group-hover:scale-110 group-hover:text-gold-champagne transition-all" />
            <span className="text-xs font-bold text-silver-metallic group-hover:text-warm-white transition-colors">Pagar Boleto</span>
          </button>

          <button 
            className="flex flex-col items-center justify-center p-6 h-24 rounded-2xl border border-white/[0.06] bg-[#121212]/50 hover:bg-[#121212] hover:border-gold-champagne/30 text-warm-white transition-all duration-200 active:scale-[0.97] cursor-pointer shadow-lg shadow-black/30 font-display group"
            onClick={() => setModalType('recharge')}
          >
            <Smartphone className="w-5 h-5 mb-2 text-silver-metallic group-hover:scale-110 group-hover:text-gold-champagne transition-all" />
            <span className="text-xs font-bold text-silver-metallic group-hover:text-warm-white transition-colors">Recarga</span>
          </button>
        </div>
      </div>

      {/* Recent Ledger Transactions */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-silver-metallic font-display mb-4">
          Transações Recentes do Razão
        </h3>
        <Card className="p-0 border border-white/[0.06] overflow-hidden">
          <div className="divide-y divide-white/[0.04]">
            {isLoading ? (
              <div className="p-6 text-center text-sm text-silver-metallic animate-pulse">
                Carregando registros...
              </div>
            ) : !recentTransactions || recentTransactions.length === 0 ? (
              <div className="p-6 text-center text-sm text-silver-metallic/55">
                Nenhuma movimentação registrada neste ledger.
              </div>
            ) : (
              recentTransactions.map((tx) => {
                const isCredit = tx.valor > 0;
                return (
                  <div key={tx.id_transacao} className="p-4.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isCredit ? 'bg-gold-champagne/10 text-gold-champagne' : 'bg-rose-500/10 text-rose-500'}`}>
                        {isCredit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-warm-white font-display">{tx.tipo_transacao}</div>
                        <div className="text-xs text-silver-metallic/70 font-sans mt-0.5">{tx.descricao || 'Sem descrição'}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-mono font-bold tabular-nums ${isCredit ? 'text-gold-champagne' : 'text-warm-white'}`}>
                        {isCredit ? '+' : ''}{formatCurrency(tx.valor)}
                      </div>
                      <div className="text-[10px] text-silver-metallic/40 font-mono mt-0.5">
                        {new Date(tx.data_transacao).toLocaleDateString('pt-BR')} {new Date(tx.data_transacao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      {/* Transaction Modals */}
      <Modal 
        isOpen={modalType !== null} 
        onClose={() => { setModalType(null); setAmount(''); setDescription(''); setTargetCode(''); }}
        title={
          modalType === 'deposit' ? 'Registrar Depósito' :
          modalType === 'withdraw' ? 'Solicitar Saque' :
          modalType === 'boleto' ? 'Pagamento de Boleto' : 'Recarga de Celular'
        }
      >
        <form onSubmit={handleAction} className="space-y-4">
          <Input
            label="Valor (R$)"
            type="number"
            step="0.01"
            placeholder="0,00"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isSubmitting}
          />

          {modalType === 'deposit' && (
            <Input
              label="Descrição do Depósito"
              placeholder="Ex: Depósito dinheiro extra"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
            />
          )}

          {modalType === 'withdraw' && (
            <Input
              label="Motivo / Descrição"
              placeholder="Ex: Saque compras básicas"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
            />
          )}

          {modalType === 'boleto' && (
            <Input
              label="Código de Barras do Boleto"
              placeholder="34191.79001 01043.513184 91020.150008 7 900000000350"
              required
              value={targetCode}
              onChange={(e) => setTargetCode(e.target.value)}
              disabled={isSubmitting}
            />
          )}

          {modalType === 'recharge' && (
            <>
              <div className="flex flex-col space-y-1.5 w-full">
                <label className="text-xs font-semibold uppercase tracking-wider text-silver-metallic font-display select-none">
                  Operadora
                </label>
                <select
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  disabled={isSubmitting}
                  className="flex w-full rounded-xl border border-white/[0.08] bg-[#090909] px-4 py-3 text-sm text-warm-white focus:outline-none focus:border-gold-champagne focus:ring-1 focus:ring-gold-champagne/30 transition-all duration-200"
                >
                  <option value="Vivo">Vivo</option>
                  <option value="Claro">Claro</option>
                  <option value="Tim">Tim</option>
                  <option value="Oi">Oi</option>
                </select>
              </div>
              <Input
                label="Número do Telefone"
                placeholder="(11) 99999-9999"
                required
                value={targetCode}
                onChange={(e) => setTargetCode(e.target.value)}
                disabled={isSubmitting}
              />
            </>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => { setModalType(null); setAmount(''); setDescription(''); setTargetCode(''); }}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Confirmar Operação
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

