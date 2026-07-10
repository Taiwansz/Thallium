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
          <span className="font-sans font-bold tracking-tight text-xl text-zinc-50 uppercase">CRIAR CONTA THALLIUM</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Nova Conta Digital</CardTitle>
            <CardDescription>
              Preencha os campos para abrir sua conta digital com ledger atômico integrado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Nome Completo"
                placeholder="Matheus Silva"
                error={errors.nome?.message}
                disabled={isSubmitting}
                {...register('nome')}
              />
              <Input
                label="Cadastro de Pessoa Física (CPF)"
                placeholder="000.000.000-00"
                error={errors.cpf?.message}
                disabled={isSubmitting}
                {...register('cpf')}
              />
              <Input
                label="Endereço de E-mail"
                type="email"
                placeholder="nome@empresa.com"
                error={errors.email?.message}
                disabled={isSubmitting}
                {...register('email')}
              />
              <Input
                label="Senha de Acesso"
                type="password"
                placeholder="Mínimo 6 caracteres"
                error={errors.password?.message}
                disabled={isSubmitting}
                {...register('password')}
              />
              
              <Button type="submit" className="w-full mt-4" isLoading={isSubmitting}>
                Criar Minha Conta
              </Button>
            </form>

            <div className="mt-6 text-center text-xs text-zinc-400 font-sans">
              Já possui uma conta ativa?{' '}
              <Link href="/login" className="text-primary hover:underline font-semibold">
                Entrar
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
