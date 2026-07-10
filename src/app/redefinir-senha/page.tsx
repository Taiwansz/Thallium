'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { motion } from 'framer-motion';

const resetSchema = z.object({
  password: z.string().min(6, 'A nova senha deve ter pelo menos 6 caracteres.'),
  confirmPassword: z.string().min(6, 'A confirmação de senha deve ter pelo menos 6 caracteres.'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem.',
  path: ['confirmPassword'],
});

type ResetForm = z.infer<typeof resetSchema>;

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isValidFlow, setIsValidFlow] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setIsValidFlow(true);
        setIsReady(true);
        return;
      }

      // Check for recovery indicators in URL
      const hash = window.location.hash;
      const search = window.location.search;
      const hasToken = hash.includes('access_token') || search.includes('code') || hash.includes('type=recovery');

      if (hasToken) {
        // Wait a short time for Supabase auth to process URL parameters
        setTimeout(async () => {
          const { data: { session: delayedSession } } = await supabase.auth.getSession();
          if (delayedSession) {
            setIsValidFlow(true);
          } else {
            setIsValidFlow(false);
          }
          setIsReady(true);
        }, 1500);
      } else {
        setIsValidFlow(false);
        setIsReady(true);
      }
    };

    checkAuth();
  }, []);

  const { register, handleSubmit, formState: { errors } } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (data: ResetForm) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        toast(error.message || 'Erro ao redefinir a senha.', 'error');
      } else {
        toast('Senha redefinida com sucesso! Redirecionando para o login...', 'success');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ocorreu um erro inesperado.';
      toast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isReady) {
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
          <span className="font-sans font-bold tracking-tight text-xl text-zinc-50 uppercase">REDEFINIR SENHA</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Nova Senha</CardTitle>
            <CardDescription>
              {isValidFlow 
                ? 'Insira e confirme sua nova senha de acesso.' 
                : 'O link de redefinição é inválido ou expirou.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isValidFlow ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <Input
                  label="Nova Senha"
                  type="password"
                  placeholder="••••••••"
                  error={errors.password?.message}
                  disabled={isSubmitting}
                  {...register('password')}
                />
                
                <Input
                  label="Confirmar Nova Senha"
                  type="password"
                  placeholder="••••••••"
                  error={errors.confirmPassword?.message}
                  disabled={isSubmitting}
                  {...register('confirmPassword')}
                />
                
                <Button type="submit" className="w-full mt-2" isLoading={isSubmitting}>
                  Atualizar Senha
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-4">
                <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-md text-xs text-zinc-400">
                  Por motivos de segurança, o link para redefinir sua senha é de uso único e possui tempo de expiração curto. Solicite uma nova redefinição.
                </div>
                <Link href="/recuperar-senha" className="w-full inline-block">
                  <Button variant="primary" className="w-full">
                    Solicitar Nova Redefinição
                  </Button>
                </Link>
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
