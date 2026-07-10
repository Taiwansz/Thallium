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
            RECUPERAR ACESSO
          </span>
        </div>

        {/* Double-bezel container */}
        <div className="p-[1.5px] rounded-3xl bg-gradient-to-b from-gold-deep/30 via-black-elevated to-gold-deep/10 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.8)]">
          <Card className="border border-black-elevated bg-black-card/85 backdrop-blur-md rounded-[22px] overflow-hidden shadow-none">
            <CardHeader className="pt-8 px-8 pb-4">
              <CardTitle className="font-display text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-warm-white to-zinc-300">
                Recuperar Senha
              </CardTitle>
              <CardDescription className="font-sans text-sm text-silver-metallic/70 mt-1.5 leading-relaxed">
                {isSent 
                  ? 'As instruções para redefinição foram enviadas para o seu e-mail.' 
                  : 'Informe seu e-mail cadastrado para enviarmos um link de redefinição de senha.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              {!isSent ? (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <Input
                    label="Endereço de E-mail"
                    type="email"
                    placeholder="nome@empresa.com"
                    error={errors.email?.message}
                    disabled={isSubmitting}
                    className="rounded-[1.25rem] border-black-elevated bg-[#0c0c0e]/80 text-warm-white focus:border-gold-champagne focus:ring-1 focus:ring-gold-champagne/30 text-sm font-sans placeholder:text-zinc-600 transition-all px-4 py-3"
                    {...register('email')}
                  />
                  
                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} className="w-full pt-2">
                    <Button 
                      type="submit" 
                      className="w-full rounded-[1.25rem] bg-gradient-to-r from-gold-deep via-gold-champagne to-gold-deep text-black-pure font-bold hover:brightness-110 shadow-[0_4px_20px_rgba(212,175,106,0.15)] select-none border-none py-3.5" 
                      isLoading={isSubmitting}
                    >
                      Enviar Link de Recuperação
                    </Button>
                  </motion.div>
                </form>
              ) : (
                <div className="text-center space-y-5 pt-2">
                  <div className="p-4 bg-black-pure/55 border border-black-elevated rounded-[1.25rem] text-xs text-silver-metallic/80 leading-relaxed font-sans">
                    Verifique sua caixa de entrada e spam para concluir a alteração da sua senha.
                  </div>
                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} className="w-full">
                    <Button 
                      variant="secondary" 
                      className="w-full rounded-[1.25rem] border border-black-elevated bg-black-elevated/45 text-warm-white font-semibold hover:bg-black-elevated/80 transition-colors py-3.5" 
                      onClick={() => setIsSent(false)}
                    >
                      Reenviar E-mail
                    </Button>
                  </motion.div>
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
