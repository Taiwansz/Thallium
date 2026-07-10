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
    <div className="flex min-h-screen bg-[#09090b] items-center justify-center p-6 select-none selection:bg-gold-champagne selection:text-black-pure">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0, transition: { type: 'spring', stiffness: 350, damping: 25 } }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-gold-deep via-gold-champagne to-gold-deep flex items-center justify-center font-display font-extrabold text-[#09090b] text-xl shadow-[0_4px_16px_rgba(212,175,106,0.25)] select-none mb-3">
            Tl
          </div>
          <span className="font-display font-extrabold tracking-widest text-lg text-transparent bg-clip-text bg-gradient-to-r from-warm-white via-gold-champagne to-warm-white select-none">
            REDEFINIR SENHA
          </span>
        </div>

        {/* Double-bezel container */}
        <div className="p-[1.5px] rounded-3xl bg-gradient-to-b from-gold-deep/30 via-black-elevated to-gold-deep/10 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.8)]">
          <Card className="border border-black-elevated bg-black-card/85 backdrop-blur-md rounded-[22px] overflow-hidden shadow-none">
            <CardHeader className="pt-8 px-8 pb-4">
              <CardTitle className="font-display text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-warm-white to-zinc-300">
                Nova Senha
              </CardTitle>
              <CardDescription className="font-sans text-sm text-silver-metallic/70 mt-1.5 leading-relaxed">
                {isValidFlow 
                  ? 'Insira e confirme sua nova senha de acesso.' 
                  : 'O link de redefinição é inválido ou expirou.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              {isValidFlow ? (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <Input
                    label="Nova Senha"
                    type="password"
                    placeholder="••••••••"
                    error={errors.password?.message}
                    disabled={isSubmitting}
                    className="rounded-[1.25rem] border-black-elevated bg-[#0c0c0e]/80 text-warm-white focus:border-gold-champagne focus:ring-1 focus:ring-gold-champagne/30 text-sm font-sans placeholder:text-zinc-600 transition-all px-4 py-3"
                    {...register('password')}
                  />
                  
                  <Input
                    label="Confirmar Nova Senha"
                    type="password"
                    placeholder="••••••••"
                    error={errors.confirmPassword?.message}
                    disabled={isSubmitting}
                    className="rounded-[1.25rem] border-black-elevated bg-[#0c0c0e]/80 text-warm-white focus:border-gold-champagne focus:ring-1 focus:ring-gold-champagne/30 text-sm font-sans placeholder:text-zinc-600 transition-all px-4 py-3"
                    {...register('confirmPassword')}
                  />
                  
                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} className="w-full pt-2">
                    <Button 
                      type="submit" 
                      className="w-full rounded-[1.25rem] bg-gradient-to-r from-gold-deep via-gold-champagne to-gold-deep text-black-pure font-bold hover:brightness-110 shadow-[0_4px_20px_rgba(212,175,106,0.15)] select-none border-none py-3.5" 
                      isLoading={isSubmitting}
                    >
                      Atualizar Senha
                    </Button>
                  </motion.div>
                </form>
              ) : (
                <div className="text-center space-y-5 pt-2">
                  <div className="p-4 bg-black-pure/55 border border-black-elevated rounded-[1.25rem] text-xs text-silver-metallic/80 leading-relaxed font-sans">
                    Por motivos de segurança, o link para redefinir sua senha é de uso único e possui tempo de expiração curto. Solicite uma nova redefinição.
                  </div>
                  <Link href="/recuperar-senha" className="w-full inline-block">
                    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} className="w-full">
                      <Button 
                        variant="primary" 
                        className="w-full rounded-[1.25rem] bg-gradient-to-r from-gold-deep via-gold-champagne to-gold-deep text-black-pure font-bold hover:brightness-110 shadow-[0_4px_20px_rgba(212,175,106,0.15)] select-none border-none py-3.5"
                      >
                        Solicitar Nova Redefinição
                      </Button>
                    </motion.div>
                  </Link>
                </div>
              )}

              <div className="mt-8 text-center text-xs text-silver-metallic/60 font-sans">
                Lembrou sua senha?{' '}
                <Link href="/login" className="text-gold-champagne hover:underline font-bold transition-colors">
                  Voltar para o Login
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
