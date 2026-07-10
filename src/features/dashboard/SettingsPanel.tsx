'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { hashPIN } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { User, Lock, CheckCircle2 } from 'lucide-react';

const profileSchema = z.object({
  nome: z.string().min(3, 'Nome completo deve conter pelo menos 3 letras.'),
});

const pinSchema = z.object({
  pin: z.string().length(4, 'O PIN deve conter exatamente 4 dígitos numéricos.').regex(/^\d+$/, 'O PIN deve conter apenas números.'),
  confirmPin: z.string().length(4, 'Confirmação do PIN deve conter exatamente 4 dígitos.'),
}).refine((data) => data.pin === data.confirmPin, {
  message: 'Os PINs informados não são idênticos.',
  path: ['confirmPin'],
});

type ProfileForm = z.infer<typeof profileSchema>;
type PinForm = z.infer<typeof pinSchema>;

export function SettingsPanel() {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();

  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPin, setIsUpdatingPin] = useState(false);

  const { register: regProfile, handleSubmit: handleProfileSubmit, formState: { errors: profileErrors } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nome: profile?.nome || '',
    },
  });

  const { register: regPin, handleSubmit: handlePinSubmit, reset: resetPin, formState: { errors: pinErrors } } = useForm<PinForm>({
    resolver: zodResolver(pinSchema),
  });

  // Update profile name
  const onProfileSubmit = async (data: ProfileForm) => {
    if (!profile) return;
    setIsUpdatingProfile(true);
    try {
      const { error } = await supabase
        .from('clientes')
        .update({ nome: data.nome })
        .eq('id_cliente', profile.id_cliente);

      if (error) throw error;

      toast('Perfil atualizado com sucesso!', 'success');
      await refreshProfile();
    } catch (err: any) {
      toast(err.message || 'Erro ao atualizar dados do perfil.', 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Update transaction PIN
  const onPinSubmit = async (data: PinForm) => {
    setIsUpdatingPin(true);
    try {
      const hashed = await hashPIN(data.pin);
      const { error } = await supabase.rpc('configurar_senha_transacao', {
        p_pin_hashed: hashed,
      });

      if (error) throw error;

      toast('Senha de transação (PIN) configurada com sucesso!', 'success');
      resetPin();
      await refreshProfile();
    } catch (err: any) {
      toast(err.message || 'Erro ao configurar senha de transação.', 'error');
    } finally {
      setIsUpdatingPin(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-zinc-100 font-sans">Configurações Contábeis</h2>
        <p className="text-xs text-zinc-400 font-sans mt-0.5">
          Gerencie seu perfil de titular e configure suas chaves de segurança transacional.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Dados do Titular</CardTitle>
            <CardDescription>Atualize seu nome de exibição no razão bancário.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
              <Input
                label="Nome Completo"
                placeholder="Nome titular"
                disabled={isUpdatingProfile}
                error={profileErrors.nome?.message}
                {...regProfile('nome')}
              />

              <div className="text-xs text-zinc-500 font-mono space-y-1 bg-zinc-950/40 p-3 rounded border border-zinc-850">
                <div>E-MAIL: {profile?.email}</div>
                <div>CPF: {profile?.cpf}</div>
              </div>

              <Button type="submit" className="w-full mt-2" isLoading={isUpdatingProfile}>
                <User className="w-4 h-4 mr-2" />
                <span>Salvar Alterações</span>
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Security Transaction PIN Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Senha de Transação (PIN)</CardTitle>
            <CardDescription>PIN de 4 dígitos exigido para efetuar Pix e transferências.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePinSubmit(onPinSubmit)} className="space-y-4">
              <div className="text-xs text-zinc-400 mb-2">
                Status atual:{' '}
                {profile?.senha_transacao ? (
                  <span className="text-primary font-bold">CONFIGURADA (ATIVADA)</span>
                ) : (
                  <span className="text-rose-500 font-bold">PENDENTE DE CONFIGURAÇÃO (DESATIVADA)</span>
                )}
              </div>

              <Input
                label="Novo PIN (4 dígitos numéricos)"
                type="password"
                placeholder="••••"
                maxLength={4}
                disabled={isUpdatingPin}
                error={pinErrors.pin?.message}
                {...regPin('pin')}
              />

              <Input
                label="Confirmar Novo PIN"
                type="password"
                placeholder="••••"
                maxLength={4}
                disabled={isUpdatingPin}
                error={pinErrors.confirmPin?.message}
                {...regPin('confirmPin')}
              />

              <Button type="submit" className="w-full mt-2" isLoading={isUpdatingPin}>
                <Lock className="w-4 h-4 mr-2" />
                <span>Configurar PIN</span>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
