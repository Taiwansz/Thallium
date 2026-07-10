'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { motion } from 'framer-motion';

const recoverySchema = z.object({
  email: z.string().email('Endereço de e-mail inválido.'),
});

type RecoveryForm = z.infer<typeof recoverySchema>;

export default function RecuperarSenhaPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RecoveryForm>({
    resolver: zodResolver(recoverySchema),
  });

  // Redirect if logged in
  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  const onSubmit = async (data: RecoveryForm) => {
    setIsSubmitting(true);
    try {
      const redirectTo = `${window.location.origin}/redefinir-senha`;
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo,
      });

      if (error) {
        toast(error.message || 'Erro ao enviar e-mail de recuperação.', 'error');
      } else {
        toast('E-mail de recuperação enviado com sucesso!', 'success');
        setIsSent(true);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro inesperado ao solicitar recuperação de senha.';
      toast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || user) {
    return (
      <div className="flex min-h-screen bg-[#09090b] items-center justify-center">
        <div className="animate-shimmer w-12 h-12 rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#09090b] items-center justify-center p-6 select-none">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0, transition: { type: 'spring', stiffness: 350, damping: 25 } }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 rounded bg-primary flex items-center justify-center font-mono font-bold text-[#09090b] text-lg select-none mb-3">
            Tl
          </div>
          <span className="font-sans font-bold tracking-tight text-xl text-zinc-50 uppercase">RECUPERAR ACESSO</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recuperar Senha</CardTitle>
            <CardDescription>
              {isSent 
                ? 'As instruções para redefinição foram enviadas para o seu e-mail.' 
                : 'Informe seu e-mail cadastrado para enviarmos um link de redefinição de senha.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isSent ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <Input
                  label="Endereço de E-mail"
                  type="email"
                  placeholder="nome@empresa.com"
                  error={errors.email?.message}
                  disabled={isSubmitting}
                  {...register('email')}
                />
                
                <Button type="submit" className="w-full mt-2" isLoading={isSubmitting}>
                  Enviar Link de Recuperação
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-4">
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-md text-xs text-zinc-400">
                  Verifique sua caixa de entrada e spam para concluir a alteração da sua senha.
                </div>
                <Button variant="secondary" className="w-full" onClick={() => setIsSent(false)}>
                  Reenviar E-mail
                </Button>
              </div>
            )}

            <div className="mt-6 text-center text-xs text-zinc-400 font-sans">
              Lembrou sua senha?{' '}
              <Link href="/login" className="text-primary hover:underline font-semibold">
                Voltar para o Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
