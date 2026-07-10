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

const loginSchema = z.object({
  email: z.string().email('Endereço de e-mail inválido.'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  // Redirect if logged in
  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  const onSubmit = async (data: LoginForm) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        toast(error.message || 'Erro ao efetuar login. Verifique suas credenciais.', 'error');
      } else {
        toast('Sessão iniciada com sucesso!', 'success');
        router.push('/dashboard');
      }
    } catch (err: any) {
      toast(err.message || 'Erro inesperado ao acessar o sistema.', 'error');
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
          <span className="font-sans font-bold tracking-tight text-xl text-zinc-50 uppercase">THALLIUM LEDGER</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Acessar Conta</CardTitle>
            <CardDescription>
              Informe suas credenciais registradas para acessar seu razão financeiro.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input
                label="Endereço de E-mail"
                type="email"
                placeholder="nome@empresa.com"
                error={errors.email?.message}
                disabled={isSubmitting}
                {...register('email')}
              />
              <div>
                <Input
                  label="Senha de Acesso"
                  type="password"
                  placeholder="••••••••"
                  error={errors.password?.message}
                  disabled={isSubmitting}
                  {...register('password')}
                />
                <div className="flex justify-end mt-2">
                  <Link
                    href="/recuperar-senha"
                    className="text-xs text-zinc-400 hover:text-primary transition-colors"
                  >
                    Esqueci minha senha
                  </Link>
                </div>
              </div>
              
              <Button type="submit" className="w-full mt-2" isLoading={isSubmitting}>
                Acessar Painel
              </Button>
            </form>

            <div className="mt-6 text-center text-xs text-zinc-400 font-sans">
              Não possui uma conta?{' '}
              <Link href="/cadastro" className="text-primary hover:underline font-semibold">
                Cadastrar-se
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
