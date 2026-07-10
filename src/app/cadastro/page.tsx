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
import { validateCPF } from '@/lib/utils';
import { motion } from 'framer-motion';

const registerSchema = z.object({
  nome: z.string().min(3, 'Nome completo deve conter pelo menos 3 letras.'),
  email: z.string().email('Endereço de e-mail inválido.'),
  cpf: z.string()
    .min(11, 'CPF deve conter exatamente 11 dígitos.')
    .max(14, 'CPF inválido.')
    .transform((val) => val.replace(/\D/g, ''))
    .refine((val) => validateCPF(val), {
      message: 'CPF matemático inválido.',
    }),
  password: z.string().min(6, 'A senha deve conter pelo menos 6 caracteres.'),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  // Redirect if logged in
  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  const onSubmit = async (data: RegisterForm) => {
    setIsSubmitting(true);
    try {
      const { data: signUpData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            nome: data.nome,
            cpf: data.cpf,
          },
        },
      });

      if (error) {
        toast(error.message || 'Erro ao registrar usuário.', 'error');
      } else {
        toast('Cadastro realizado com sucesso! Verifique seu e-mail caso necessário.', 'success');
        router.push('/dashboard');
      }
    } catch (err: any) {
      toast(err.message || 'Ocorreu um erro inesperado durante o cadastro.', 'error');
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
        className="w-full max-w-md my-8"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-gold-deep via-gold-champagne to-gold-deep flex items-center justify-center font-display font-extrabold text-[#09090b] text-xl shadow-[0_4px_16px_rgba(212,175,106,0.25)] select-none mb-3">
            Tl
          </div>
          <span className="font-display font-extrabold tracking-widest text-lg text-transparent bg-clip-text bg-gradient-to-r from-warm-white via-gold-champagne to-warm-white select-none">
            CRIAR CONTA THALLIUM
          </span>
        </div>

        {/* Double-bezel container */}
        <div className="p-[1.5px] rounded-3xl bg-gradient-to-b from-gold-deep/30 via-black-elevated to-gold-deep/10 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.8)]">
          <Card className="border border-black-elevated bg-black-card/85 backdrop-blur-md rounded-[22px] overflow-hidden shadow-none">
            <CardHeader className="pt-8 px-8 pb-4">
              <CardTitle className="font-display text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-warm-white to-zinc-300">
                Nova Conta Digital
              </CardTitle>
              <CardDescription className="font-sans text-sm text-silver-metallic/70 mt-1.5 leading-relaxed">
                Preencha os campos para abrir sua conta digital com ledger atômico integrado.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label="Nome Completo"
                  placeholder="Matheus Silva"
                  error={errors.nome?.message}
                  disabled={isSubmitting}
                  className="rounded-[1.25rem] border-black-elevated bg-[#0c0c0e]/80 text-warm-white focus:border-gold-champagne focus:ring-1 focus:ring-gold-champagne/30 text-sm font-sans placeholder:text-zinc-600 transition-all px-4 py-3"
                  {...register('nome')}
                />
                <Input
                  label="Cadastro de Pessoa Física (CPF)"
                  placeholder="000.000.000-00"
                  error={errors.cpf?.message}
                  disabled={isSubmitting}
                  className="rounded-[1.25rem] border-black-elevated bg-[#0c0c0e]/80 text-warm-white focus:border-gold-champagne focus:ring-1 focus:ring-gold-champagne/30 text-sm font-sans placeholder:text-zinc-600 transition-all px-4 py-3"
                  {...register('cpf')}
                />
                <Input
                  label="Endereço de E-mail"
                  type="email"
                  placeholder="nome@empresa.com"
                  error={errors.email?.message}
                  disabled={isSubmitting}
                  className="rounded-[1.25rem] border-black-elevated bg-[#0c0c0e]/80 text-warm-white focus:border-gold-champagne focus:ring-1 focus:ring-gold-champagne/30 text-sm font-sans placeholder:text-zinc-600 transition-all px-4 py-3"
                  {...register('email')}
                />
                <Input
                  label="Senha de Acesso"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  error={errors.password?.message}
                  disabled={isSubmitting}
                  className="rounded-[1.25rem] border-black-elevated bg-[#0c0c0e]/80 text-warm-white focus:border-gold-champagne focus:ring-1 focus:ring-gold-champagne/30 text-sm font-sans placeholder:text-zinc-600 transition-all px-4 py-3"
                  {...register('password')}
                />
                
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} className="w-full pt-4">
                  <Button 
                    type="submit" 
                    className="w-full rounded-[1.25rem] bg-gradient-to-r from-gold-deep via-gold-champagne to-gold-deep text-black-pure font-bold hover:brightness-110 shadow-[0_4px_20px_rgba(212,175,106,0.15)] select-none border-none py-3.5" 
                    isLoading={isSubmitting}
                  >
                    Criar Minha Conta
                  </Button>
                </motion.div>
              </form>

              <div className="mt-8 text-center text-xs text-silver-metallic/60 font-sans">
                Já possui uma conta ativa?{' '}
                <Link href="/login" className="text-gold-champagne hover:underline font-bold transition-colors">
                  Entrar
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
