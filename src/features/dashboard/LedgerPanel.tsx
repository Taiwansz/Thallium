'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ArrowUpRight, ArrowDownLeft, Search, FileText } from 'lucide-react';

interface Transaction {
  id_transacao: string;
  numero_conta: number;
  tipo_transacao: string;
  valor: number;
  data_transacao: string;
  descricao: string;
  categoria: string;
}

export function LedgerPanel() {
  const { conta } = useAuth();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const itemsPerPage = 10;

  // Fetch count and transactions
  const { data, isLoading } = useQuery<{ items: Transaction[]; totalCount: number }>({
    queryKey: ['ledgerTransactions', conta?.numero_conta, search, page],
    queryFn: async () => {
      if (!conta) return { items: [], totalCount: 0 };
      
      let query = supabase
        .from('transacoes')
        .select('*', { count: 'exact' })
        .eq('numero_conta', conta.numero_conta)
        .order('data_transacao', { ascending: false });

      if (search) {
        query = query.or(`descricao.ilike.%${search}%,categoria.ilike.%${search}%,tipo_transacao.ilike.%${search}%`);
      }

      // Pagination
      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      
      const { data: items, count, error } = await query.range(from, to);
      if (error) throw error;

      return {
        items: items || [],
        totalCount: count || 0,
      };
    },
    enabled: !!conta,
  });

  const transactions = data?.items || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-100">Razão de Transações</h2>
          <p className="text-xs text-zinc-400 font-sans mt-0.5">
            Auditabilidade total de movimentações contábeis.
          </p>
        </div>

        {/* Search bar */}
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por descrição..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-900 border border-zinc-800 rounded-[0.375rem] text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Transactions list */}
      <Card className="p-0">
        <div className="divide-y divide-zinc-800">
          {isLoading ? (
            <div className="p-12 text-center text-sm text-zinc-400 animate-pulse">
              Carregando lançamentos...
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center text-sm text-zinc-500 font-sans">
              Nenhuma transação encontrada para a pesquisa indicada.
            </div>
          ) : (
            transactions.map((tx) => {
              const isCredit = tx.valor > 0;
              return (
                <div 
                  key={tx.id_transacao} 
                  onClick={() => setSelectedTx(tx)}
                  className="p-4 flex items-center justify-between hover:bg-zinc-850/40 cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCredit ? 'bg-primary/10 text-primary' : 'bg-rose-500/10 text-rose-500'}`}>
                      {isCredit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-zinc-200">{tx.tipo_transacao}</div>
                      <div className="text-xs text-zinc-400 font-sans">{tx.descricao || 'Sem descrição'}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <div className={`text-sm font-mono font-semibold tabular-nums ${isCredit ? 'text-primary' : 'text-zinc-300'}`}>
                        {isCredit ? '+' : ''}{formatCurrency(tx.valor)}
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono">
                        {new Date(tx.data_transacao).toLocaleDateString('pt-BR')} {new Date(tx.data_transacao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <FileText className="w-4 h-4 text-zinc-500 hover:text-zinc-300 transition-colors" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-zinc-500 font-mono">
            PÁGINA {page} DE {totalPages} ({totalCount} LANÇAMENTOS)
          </span>
          <div className="flex space-x-2">
            <Button
              variant="secondary"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="py-1.5 px-3"
            >
              Anterior
            </Button>
            <Button
              variant="secondary"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="py-1.5 px-3"
            >
              Próxima
            </Button>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      <Modal
        isOpen={selectedTx !== null}
        onClose={() => setSelectedTx(null)}
        title="Comprovante de Transação"
      >
        {selectedTx && (
          <div className="space-y-6">
            <div className="text-center py-6 border-b border-zinc-800">
              <div className="text-xs text-zinc-400 uppercase tracking-widest font-mono">VALOR DA OPERAÇÃO</div>
              <div className={`text-3xl font-bold font-mono tracking-tight tabular-nums mt-1 ${selectedTx.valor > 0 ? 'text-primary' : 'text-zinc-200'}`}>
                {selectedTx.valor > 0 ? '+' : ''}{formatCurrency(selectedTx.valor)}
              </div>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-zinc-800/40">
                <span className="text-zinc-500">TIPO DE OPERAÇÃO</span>
                <span className="text-zinc-200 font-bold">{selectedTx.tipo_transacao}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/40">
                <span className="text-zinc-500">CATEGORIA</span>
                <span className="text-zinc-200">{selectedTx.categoria}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/40">
                <span className="text-zinc-500">DATA E HORA</span>
                <span className="text-zinc-200">
                  {new Date(selectedTx.data_transacao).toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/40">
                <span className="text-zinc-500">DESCRIÇÃO</span>
                <span className="text-zinc-200 max-w-[200px] text-right truncate">
                  {selectedTx.descricao || '-'}
                </span>
              </div>
              <div className="flex flex-col py-1 space-y-1">
                <span className="text-zinc-500">ID DE AUTENTICAÇÃO LEDGER</span>
                <span className="text-zinc-400 select-all font-mono break-all bg-zinc-950 p-2 rounded border border-zinc-800 text-[10px]">
                  {selectedTx.id_transacao}
                </span>
              </div>
            </div>

            <div className="flex justify-center pt-4">
              <Button onClick={() => setSelectedTx(null)} className="w-full">
                Fechar Comprovante
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
