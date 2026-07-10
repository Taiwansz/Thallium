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
import { Calculator, Plus, Landmark, AlertCircle } from 'lucide-react';

interface Loan {
  id_emprestimo: string;
  numero_conta: number;
  valor_emprestimo: number;
  juros: number;
  prazo: number;
  data_emprestimo: string;
  data_vencimento: string;
  status: 'pendente' | 'aprovado' | 'negado';
}

export function LoansPanel() {
  const { conta } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [loanAmount, setLoanAmount] = useState('');
  const [months, setMonths] = useState('12');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Interest rate is fixed at 5% p.m.
  const interestRate = 5; 

  // Fetch client loans
  const { data: loans, isLoading } = useQuery<Loan[]>({
    queryKey: ['clientLoans', conta?.numero_conta],
    queryFn: async () => {
      if (!conta) return [];
      const { data, error } = await supabase
        .from('emprestimos')
        .select('*')
        .eq('numero_conta', conta.numero_conta)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!conta,
  });

  // PMT Calculation Formula
  const calculatePMT = () => {
    const P = parseFloat(loanAmount);
    const n = parseInt(months);
    if (isNaN(P) || P <= 0 || isNaN(n) || n <= 0) return { pmt: 0, totalInterest: 0, totalRepay: 0 };

    const i = interestRate / 100;
    // PMT = (P * i) / (1 - (1 + i)^-n)
    const pmt = (P * i) / (1 - Math.pow(1 + i, -n));
    const totalRepay = pmt * n;
    const totalInterest = totalRepay - P;

    return {
      pmt: Math.round(pmt * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      totalRepay: Math.round(totalRepay * 100) / 100,
    };
  };

  const simulation = calculatePMT();

  const handleRequestLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conta) return;

    const val = parseFloat(loanAmount);
    const term = parseInt(months);

    if (isNaN(val) || val <= 0) {
      toast('Insira um valor de empréstimo válido.', 'error');
      return;
    }

    if (isNaN(term) || term <= 0) {
      toast('Insira um prazo válido em parcelas.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.rpc('solicitar_emprestimo', {
        p_valor: val,
        p_prazo: term,
      });

      if (error) throw error;

      toast('Solicitação de empréstimo enviada com sucesso para análise!', 'success');
      setLoanAmount('');
      setMonths('12');
      queryClient.invalidateQueries({ queryKey: ['clientLoans'] });
    } catch (err: any) {
      toast(err.message || 'Erro ao solicitar empréstimo.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-zinc-100 font-sans">Mesa de Crédito & Empréstimos</h2>
        <p className="text-xs text-zinc-400 font-sans mt-0.5">
          Simule planos de amortização e solicite linhas de crédito direto.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Simulator Form */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Simulador PMT</CardTitle>
            <CardDescription>Simule parcelas sob taxa fixa de 5% a.m.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRequestLoan} className="space-y-4">
              <Input
                label="Valor do Crédito (R$)"
                type="number"
                step="100"
                placeholder="Ex: 5000"
                required
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                disabled={isSubmitting}
              />

              <div className="flex flex-col space-y-1.5 w-full">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Prazo (Meses)</label>
                <select
                  value={months}
                  onChange={(e) => setMonths(e.target.value)}
                  disabled={isSubmitting}
                  className="flex w-full rounded-[0.375rem] border border-zinc-800 bg-[#09090b] px-3.5 py-2.5 text-sm text-zinc-50 focus:outline-none focus:border-primary"
                >
                  <option value="6">6 meses</option>
                  <option value="12">12 meses</option>
                  <option value="24">24 meses</option>
                  <option value="36">36 meses</option>
                  <option value="48">48 meses</option>
                </select>
              </div>

              {simulation.pmt > 0 && (
                <div className="bg-zinc-950/60 p-4 rounded border border-zinc-850 space-y-2 font-mono text-xs text-zinc-400">
                  <div className="flex justify-between">
                    <span>PARCELA MENSAL:</span>
                    <strong className="text-zinc-200 tabular-nums">{formatCurrency(simulation.pmt)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>JUROS TOTAIS:</span>
                    <strong className="text-rose-500/80 tabular-nums">{formatCurrency(simulation.totalInterest)}</strong>
                  </div>
                  <div className="flex justify-between border-t border-zinc-850 pt-2 text-zinc-300">
                    <span>TOTAL A PAGAR:</span>
                    <strong className="text-primary tabular-nums">{formatCurrency(simulation.totalRepay)}</strong>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full mt-2" isLoading={isSubmitting}>
                <Calculator className="w-4 h-4 mr-2" />
                <span>Solicitar Crédito</span>
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Requested Loans List */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Histórico de Solicitações</CardTitle>
            <CardDescription>Status das suas análises de crédito.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-zinc-800">
              {isLoading ? (
                <div className="p-6 text-center text-sm text-zinc-400 animate-pulse">Carregando solicitações...</div>
              ) : !loans || loans.length === 0 ? (
                <div className="p-6 text-center text-sm text-zinc-500 font-sans">Nenhuma solicitação de crédito em andamento.</div>
              ) : (
                loans.map((loan) => (
                  <div key={loan.id_emprestimo} className="p-4 flex items-center justify-between hover:bg-zinc-850/20 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-950 text-zinc-400 flex items-center justify-center border border-zinc-800">
                        <Landmark className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-zinc-200">
                          Crédito de {formatCurrency(loan.valor_emprestimo)}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono">
                          SOLICITADO EM: {new Date(loan.data_emprestimo).toLocaleDateString('pt-BR')} • {loan.prazo} PARCELAS
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-mono font-bold text-zinc-100 tabular-nums">
                        {formatCurrency(loan.valor_emprestimo * (1 + (loan.juros/100) * (loan.prazo/12)))} {/* Simple calculation display */}
                      </div>
                      <span className={`inline-block text-[9px] font-mono uppercase px-2 py-0.5 rounded mt-1 font-semibold ${
                        loan.status === 'aprovado' ? 'bg-primary/10 text-primary' :
                        loan.status === 'negado' ? 'bg-rose-500/10 text-rose-500' :
                        'bg-zinc-800 text-zinc-400'
                      }`}>
                        {loan.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
