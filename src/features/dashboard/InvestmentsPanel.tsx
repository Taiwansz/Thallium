'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { formatCurrency } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { TrendingUp, Plus } from 'lucide-react';

interface Investment {
  id: string;
  id_cliente: string;
  tipo: 'CDB' | 'LCI' | 'Tesouro';
  valor_inicial: number;
  data_aplicacao: string;
  taxa_anual: number;
  resgatado: boolean;
}

export function InvestmentsPanel() {
  const { profile, conta, refreshConta } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [invType, setInvType] = useState<'CDB' | 'LCI' | 'Tesouro'>('CDB');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch active investments
  const { data: investments, isLoading } = useQuery<Investment[]>({
    queryKey: ['activeInvestments', profile?.id_cliente],
    queryFn: async () => {
      if (!profile) return [];
      const { data, error } = await supabase
        .from('investimentos')
        .select('*')
        .eq('id_cliente', profile.id_cliente)
        .eq('resgatado', false)
        .order('data_aplicacao', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile,
  });

  // Calculate yield helper
  const calculateCurrentValue = (inv: Investment) => {
    const appDate = new Date(inv.data_aplicacao);
    const now = new Date();
    
    // Time difference in days
    const diffTime = Math.max(0, now.getTime() - appDate.getTime());
    const daysElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    const dailyRate = (inv.taxa_anual / 100) / 365;
    const yieldAmount = inv.valor_inicial * (dailyRate * daysElapsed);
    
    return {
      yieldAmount: Math.round(yieldAmount * 100) / 100,
      total: Math.round((Number(inv.valor_inicial) + yieldAmount) * 100) / 100,
      daysElapsed,
    };
  };

  // Submit investment application
  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conta) return;

    const val = parseFloat(amount);
    if (isNaN(val) || val < 100) {
      toast('Valor de investimento mínimo é de R$ 100,00.', 'error');
      return;
    }

    if (conta.saldo < val) {
      toast('Saldo em conta corrente insuficiente.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.rpc('investir_recursos', {
        p_tipo: invType,
        p_valor: val,
      });

      if (error) throw error;

      toast('Investimento realizado com sucesso!', 'success');
      setAmount('');
      await refreshConta();
      queryClient.invalidateQueries({ queryKey: ['activeInvestments'] });
      queryClient.invalidateQueries({ queryKey: ['recentTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['ledgerTransactions'] });
    } catch (err: any) {
      toast(err.message || 'Erro ao efetuar investimento.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redeem investment
  const handleRedeem = async (id: string) => {
    try {
      const { error } = await supabase.rpc('resgatar_investimento', {
        p_id_investimento: id,
      });

      if (error) throw error;

      toast('Investimento resgatado e creditado em conta!', 'success');
      await refreshConta();
      queryClient.invalidateQueries({ queryKey: ['activeInvestments'] });
      queryClient.invalidateQueries({ queryKey: ['recentTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['ledgerTransactions'] });
    } catch (err: any) {
      toast(err.message || 'Erro ao efetuar resgate.', 'error');
    }
  };

  // Total portfolio value
  const totalPortfolio = investments?.reduce((sum, inv) => sum + calculateCurrentValue(inv).total, 0) || 0;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-wide text-warm-white font-display">Mesa de Investimentos Thallium</h2>
          <p className="text-xs text-silver-metallic/70 font-sans mt-1">
            Títulos de Renda Fixa CDB, LCI e Tesouro com yield diário progressivo.
          </p>
        </div>

        {/* Portfolio Balance */}
        <Card className="p-4 bg-black-pure flex flex-col justify-center border border-white/[0.08] rounded-xl shadow-lg">
          <span className="text-[10px] text-silver-metallic/60 font-mono uppercase tracking-wider">CARTEIRA CONSOLIDADA</span>
          <span className="text-xl font-bold font-mono text-gold-champagne tabular-nums mt-0.5">
            {formatCurrency(totalPortfolio)}
          </span>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Invest Form */}
        <Card className="md:col-span-1 border border-white/[0.06] p-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-silver-metallic">Nova Aplicação</CardTitle>
            <CardDescription>Escolha o título e o valor a aplicar.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleApply} className="space-y-4">
              <div className="flex flex-col space-y-1.5 w-full">
                <label className="text-xs font-semibold uppercase tracking-wider text-silver-metallic font-display select-none">Tipo de Título</label>
                <select
                  value={invType}
                  onChange={(e) => setInvType(e.target.value as any)}
                  className="flex w-full rounded-xl border border-white/[0.08] bg-[#090909] px-4 py-3 text-sm text-warm-white focus:outline-none focus:border-gold-champagne focus:ring-1 focus:ring-gold-champagne/30 transition-all duration-200"
                >
                  <option value="CDB">CDB (12,50% a.a.)</option>
                  <option value="LCI">LCI (11,20% a.a. isento IR)</option>
                  <option value="Tesouro">Tesouro Direto (10,80% a.a.)</option>
                </select>
              </div>

              <Input
                label="Valor Mínimo R$ 100,00"
                type="number"
                step="0.01"
                placeholder="100,00"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isSubmitting}
              />

              <Button type="submit" className="w-full mt-2" isLoading={isSubmitting}>
                <Plus className="w-4 h-4 mr-2" />
                <span>Aplicar Recursos</span>
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Active Positions */}
        <Card className="md:col-span-2 border border-white/[0.06] p-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-silver-metallic">Posições Ativas</CardTitle>
            <CardDescription>Acompanhe o rendimento de suas aplicações.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-white/[0.04]">
              {isLoading ? (
                <div className="p-6 text-center text-sm text-silver-metallic animate-pulse">Carregando posições...</div>
              ) : !investments || investments.length === 0 ? (
                <div className="p-6 text-center text-sm text-silver-metallic/50 font-sans">Nenhum investimento ativo neste perfil contábil.</div>
              ) : (
                investments.map((inv) => {
                  const values = calculateCurrentValue(inv);
                  return (
                    <div key={inv.id} className="p-4.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-8.5 h-8.5 rounded-full bg-gold-champagne/10 text-gold-champagne flex items-center justify-center">
                          <TrendingUp className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-warm-white font-display">
                            {inv.tipo} ({inv.taxa_anual.toFixed(2)}% a.a.)
                          </div>
                          <div className="text-[10px] text-silver-metallic/50 font-mono mt-0.5">
                            APLICAÇÃO: {new Date(inv.data_aplicacao).toLocaleDateString('pt-BR')} • {values.daysElapsed} DIAS CORRIDOS
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6">
                        <div className="text-right font-mono">
                          <div className="text-sm font-bold text-warm-white tabular-nums">
                            {formatCurrency(values.total)}
                          </div>
                          <div className="text-[10px] text-gold-champagne font-bold tabular-nums mt-0.5">
                            + {formatCurrency(values.yieldAmount)}
                          </div>
                        </div>
                        <Button
                          variant="secondary"
                          className="py-2 px-3 text-xs rounded-xl font-display font-semibold"
                          onClick={() => handleRedeem(inv.id)}
                        >
                          Resgatar
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

