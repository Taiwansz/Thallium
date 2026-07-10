'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { formatCurrency, hashPIN } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { Plus, Trash2, Key, Send, Landmark } from 'lucide-react';

interface PixKey {
  id: string;
  tipo: string;
  chave: string;
  id_cliente: string;
}

const emailTransferSchema = z.object({
  email: z.string().email('E-mail destinatário inválido.'),
  amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Insira um valor numérico positivo.',
  }),
  description: z.string().max(100, 'Máximo 100 caracteres.'),
  pin: z.string().length(4, 'PIN deve ter exatamente 4 dígitos.').optional(),
});

const pixTransferSchema = z.object({
  key: z.string().min(3, 'Insira uma chave Pix válida.'),
  amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Insira um valor numérico positivo.',
  }),
  pin: z.string().length(4, 'PIN deve ter exatamente 4 dígitos.').optional(),
});

type EmailTransferForm = z.infer<typeof emailTransferSchema>;
type PixTransferForm = z.infer<typeof pixTransferSchema>;

export function TransfersPanel() {
  const { profile, conta, refreshConta } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'email' | 'pix' | 'keys'>('email');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Key Registration state
  const [newKeyType, setNewKeyType] = useState<'cpf' | 'email' | 'aleatoria'>('aleatoria');
  const [customKey, setCustomKey] = useState('');
  const [isCreatingKey, setIsCreatingKey] = useState(false);

  // Fetch Pix keys
  const { data: pixKeys, isLoading: loadingKeys } = useQuery<PixKey[]>({
    queryKey: ['pixKeys', profile?.id_cliente],
    queryFn: async () => {
      if (!profile) return [];
      const { data, error } = await supabase
        .from('chaves_pix')
        .select('*')
        .eq('id_cliente', profile.id_cliente);
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile,
  });

  const { register: regEmail, handleSubmit: handleEmailSubmit, reset: resetEmail, formState: { errors: emailErrors } } = useForm<EmailTransferForm>({
    resolver: zodResolver(emailTransferSchema),
  });

  const { register: regPix, handleSubmit: handlePixSubmit, reset: resetPix, formState: { errors: pixErrors } } = useForm<PixTransferForm>({
    resolver: zodResolver(pixTransferSchema),
  });

  // Verify PIN (if configured)
  const verifyPinHelper = async (pinInput?: string): Promise<boolean> => {
    if (!profile?.senha_transacao) return true; // PIN not configured, skip check
    if (!pinInput) {
      toast('Senha de transação (PIN) é obrigatória para efetuar operações.', 'error');
      return false;
    }
    const hashed = await hashPIN(pinInput);
    const { data: isMatch, error } = await supabase.rpc('verificar_pin_transacao', {
      p_pin_hashed: hashed,
    });
    if (error) {
      toast('Erro ao verificar senha de transação.', 'error');
      return false;
    }
    if (!isMatch) {
      toast('Senha de transação incorreta.', 'error');
      return false;
    }
    return true;
  };

  // Submit email transfer
  const onEmailTransferSubmit = async (data: EmailTransferForm) => {
    if (!conta) return;
    const val = parseFloat(data.amount);
    if (conta.saldo < val) {
      toast('Saldo insuficiente.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const pinVerified = await verifyPinHelper(data.pin);
      if (!pinVerified) {
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase.rpc('transferir_dinheiro', {
        p_destinatario_email: data.email,
        p_valor: val,
        p_descricao: data.description || 'Transferência online',
        p_categoria: 'Transferência',
      });

      if (error) throw error;

      toast('Transferência efetuada com sucesso!', 'success');
      resetEmail();
      await refreshConta();
      queryClient.invalidateQueries({ queryKey: ['recentTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['ledgerTransactions'] });
    } catch (err: any) {
      toast(err.message || 'Erro ao efetuar transferência por e-mail.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit PIX transfer
  const onPixTransferSubmit = async (data: PixTransferForm) => {
    if (!conta) return;
    const val = parseFloat(data.amount);
    if (conta.saldo < val) {
      toast('Saldo insuficiente.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const pinVerified = await verifyPinHelper(data.pin);
      if (!pinVerified) {
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase.rpc('realizar_pix', {
        p_chave_pix: data.key,
        p_valor: val,
      });

      if (error) throw error;

      toast('Pix enviado com sucesso!', 'success');
      resetPix();
      await refreshConta();
      queryClient.invalidateQueries({ queryKey: ['recentTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['ledgerTransactions'] });
    } catch (err: any) {
      toast(err.message || 'Chave Pix não encontrada ou erro no processamento.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create PIX Key
  const handleCreatePixKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    let finalKey = customKey;
    if (newKeyType === 'cpf') {
      finalKey = profile.cpf;
    } else if (newKeyType === 'email') {
      finalKey = profile.email;
    } else if (newKeyType === 'aleatoria') {
      // Generate client-side random key if needed, or let trigger/db handle it
      finalKey = Array.from({ length: 32 }, () => Math.random().toString(36)[2] || '0').join('');
    }

    if (!finalKey) {
      toast('Informe o valor da chave.', 'error');
      return;
    }

    setIsCreatingKey(true);
    try {
      const { error } = await supabase
        .from('chaves_pix')
        .insert({
          tipo: newKeyType,
          chave: finalKey,
          id_cliente: profile.id_cliente,
        });

      if (error) {
        if (error.code === '23505') {
          toast('Esta chave Pix já está registrada no sistema.', 'error');
        } else {
          throw error;
        }
      } else {
        toast('Chave Pix cadastrada!', 'success');
        setCustomKey('');
        queryClient.invalidateQueries({ queryKey: ['pixKeys'] });
      }
    } catch (err: any) {
      toast(err.message || 'Erro ao registrar chave Pix.', 'error');
    } finally {
      setIsCreatingKey(false);
    }
  };

  // Delete PIX Key
  const handleDeletePixKey = async (id: string) => {
    try {
      const { error } = await supabase
        .from('chaves_pix')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast('Chave Pix excluída.', 'success');
      queryClient.invalidateQueries({ queryKey: ['pixKeys'] });
    } catch (err: any) {
      toast(err.message || 'Erro ao deletar chave Pix.', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-xl font-bold tracking-wide text-warm-white font-display">Transferências Financeiras</h2>
        <p className="text-xs text-silver-metallic/70 font-sans mt-1">
          Efetue transferências instantâneas Pix, TEDs e gerencie suas chaves digitais.
        </p>
      </div>

      {/* Internal Tabs */}
      <div className="flex border-b border-white/[0.06] space-x-6">
        <button
          onClick={() => setActiveTab('email')}
          className={`py-3 text-sm font-bold border-b-2 cursor-pointer transition-colors font-display ${activeTab === 'email' ? 'border-gold-champagne text-gold-champagne' : 'border-transparent text-silver-metallic hover:text-warm-white'}`}
        >
          Transferência por E-mail
        </button>
        <button
          onClick={() => setActiveTab('pix')}
          className={`py-3 text-sm font-bold border-b-2 cursor-pointer transition-colors font-display ${activeTab === 'pix' ? 'border-gold-champagne text-gold-champagne' : 'border-transparent text-silver-metallic hover:text-warm-white'}`}
        >
          Área Pix
        </button>
        <button
          onClick={() => setActiveTab('keys')}
          className={`py-3 text-sm font-bold border-b-2 cursor-pointer transition-colors font-display ${activeTab === 'keys' ? 'border-gold-champagne text-gold-champagne' : 'border-transparent text-silver-metallic hover:text-warm-white'}`}
        >
          Minhas Chaves Pix
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'email' && (
        <Card className="max-w-md border border-white/[0.06] p-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-silver-metallic">Enviar Dinheiro por E-mail</CardTitle>
            <CardDescription>Envie recursos diretamente informando o e-mail cadastrado do destinatário.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailSubmit(onEmailTransferSubmit)} className="space-y-4">
              <Input
                label="E-mail do Beneficiário"
                placeholder="exemplo@empresa.com"
                disabled={isSubmitting}
                error={emailErrors.email?.message}
                {...regEmail('email')}
              />
              <Input
                label="Valor (R$)"
                placeholder="0,00"
                type="number"
                step="0.01"
                disabled={isSubmitting}
                error={emailErrors.amount?.message}
                {...regEmail('amount')}
              />
              <Input
                label="Mensagem / Descrição"
                placeholder="Ex: Pagamento almoço"
                disabled={isSubmitting}
                error={emailErrors.description?.message}
                {...regEmail('description')}
              />

              {profile?.senha_transacao && (
                <Input
                  label="Senha de Transação (4 dígitos)"
                  type="password"
                  placeholder="••••"
                  maxLength={4}
                  disabled={isSubmitting}
                  error={emailErrors.pin?.message}
                  {...regEmail('pin')}
                />
              )}

              <Button type="submit" className="w-full mt-2" isLoading={isSubmitting}>
                <Send className="w-4 h-4 mr-2" />
                <span>Confirmar Transferência</span>
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === 'pix' && (
        <Card className="max-w-md border border-white/[0.06] p-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-silver-metallic">Enviar Pix Instantâneo</CardTitle>
            <CardDescription>Informe qualquer chave Pix registrada no sistema (CPF, E-mail ou chave aleatória).</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePixSubmit(onPixTransferSubmit)} className="space-y-4">
              <Input
                label="Chave Pix do Destinatário"
                placeholder="CPF, e-mail ou código de 32 caracteres"
                disabled={isSubmitting}
                error={pixErrors.key?.message}
                {...regPix('key')}
              />
              <Input
                label="Valor (R$)"
                placeholder="0,00"
                type="number"
                step="0.01"
                disabled={isSubmitting}
                error={pixErrors.amount?.message}
                {...regPix('amount')}
              />

              {profile?.senha_transacao && (
                <Input
                  label="Senha de Transação (4 dígitos)"
                  type="password"
                  placeholder="••••"
                  maxLength={4}
                  disabled={isSubmitting}
                  error={pixErrors.pin?.message}
                  {...regPix('pin')}
                />
              )}

              <Button type="submit" className="w-full mt-2" isLoading={isSubmitting}>
                <Landmark className="w-4 h-4 mr-2" />
                <span>Enviar Pix</span>
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === 'keys' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Register Key Form */}
          <Card className="md:col-span-1 border border-white/[0.06] p-2">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-silver-metallic">Registrar Chave Pix</CardTitle>
              <CardDescription>Cadastre chaves para receber Pix de outros clientes.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreatePixKey} className="space-y-4">
                <div className="flex flex-col space-y-1.5 w-full">
                  <label className="text-xs font-semibold uppercase tracking-wider text-silver-metallic font-display select-none">Tipo de Chave</label>
                  <select
                    value={newKeyType}
                    onChange={(e) => {
                      setNewKeyType(e.target.value as any);
                      setCustomKey('');
                    }}
                    className="flex w-full rounded-xl border border-white/[0.08] bg-[#090909] px-4 py-3 text-sm text-warm-white focus:outline-none focus:border-gold-champagne focus:ring-1 focus:ring-gold-champagne/30 transition-all duration-200"
                  >
                    <option value="aleatoria">Aleatória (Gerada automaticamente)</option>
                    <option value="cpf">CPF (Vinculado ao perfil)</option>
                    <option value="email">E-mail (Vinculado ao perfil)</option>
                  </select>
                </div>

                {newKeyType === 'cpf' && (
                  <div className="text-xs text-silver-metallic/70 bg-[#090909]/60 p-4 rounded-xl border border-white/[0.06] leading-relaxed">
                    A chave criada utilizará seu CPF cadastrado: <strong className="text-warm-white font-bold font-mono">{profile?.cpf}</strong>.
                  </div>
                )}

                {newKeyType === 'email' && (
                  <div className="text-xs text-silver-metallic/70 bg-[#090909]/60 p-4 rounded-xl border border-white/[0.06] leading-relaxed">
                    A chave criada utilizará seu e-mail cadastrado: <strong className="text-warm-white font-bold">{profile?.email}</strong>.
                  </div>
                )}

                <Button type="submit" className="w-full mt-2" isLoading={isCreatingKey}>
                  <Plus className="w-4 h-4 mr-2" />
                  <span>Cadastrar Chave</span>
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Keys list */}
          <Card className="md:col-span-2 border border-white/[0.06] p-2">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-silver-metallic">Suas Chaves Registradas</CardTitle>
              <CardDescription>Chaves vinculadas à sua conta digital.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/[0.04]">
                {loadingKeys ? (
                  <div className="p-6 text-center text-sm text-silver-metallic animate-pulse">Carregando chaves...</div>
                ) : !pixKeys || pixKeys.length === 0 ? (
                  <div className="p-6 text-center text-sm text-silver-metallic/50 font-sans">Nenhuma chave Pix cadastrada para esta conta.</div>
                ) : (
                  pixKeys.map((key) => (
                    <div key={key.id} className="p-4.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center space-x-3">
                        <Key className="w-4 h-4 text-gold-champagne" />
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-silver-metallic/50 font-display">{key.tipo}</div>
                          <div className="text-sm font-mono text-warm-white break-all select-all mt-0.5">{key.chave}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeletePixKey(key.id)}
                        className="text-silver-metallic/40 hover:text-rose-500 transition-colors p-2 rounded-xl hover:bg-white/[0.05] cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

