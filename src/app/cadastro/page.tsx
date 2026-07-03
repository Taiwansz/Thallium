"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cadastrarCliente } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { motion } from "framer-motion";

export default function CadastroPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);

    const res = await cadastrarCliente(formData);

    if (res.error) {
      setError(res.error);
      setLoading(false);
    } else {
      router.push("/login?cadastrado=true");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute bottom-1/4 right-1/4 w-[40vw] h-[40vw] rounded-full bg-primary/10 blur-[150px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md z-10 my-8"
      >
        <Card>
          <CardHeader className="text-center pb-6">
             <div className="w-12 h-12 bg-secondary border border-border flex items-center justify-center mx-auto mb-6 relative">
               <div className="absolute inset-0 bg-primary/20 blur-md"></div>
               <span className="text-primary font-bold text-xl relative z-10">Tl</span>
            </div>
            <CardTitle>THALLIUM BANK</CardTitle>
            <CardDescription>CADASTRO DE CLIENTE</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {error && (
                <div className="p-3 text-sm text-destructive font-medium border-l-2 border-destructive bg-destructive/10">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="nome">NOME COMPLETO</Label>
                <Input id="nome" name="nome" required placeholder="NOME DO TITULAR" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input id="cpf" name="cpf" required maxLength={11} placeholder="SOMENTE NÚMEROS" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">EMAIL</Label>
                <Input id="email" name="email" type="email" required placeholder="SEU@EMAIL.COM" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senha">SENHA</Label>
                <Input id="senha" name="senha" type="password" required minLength={6} placeholder="MÍNIMO 6 CARACTERES" />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-6 pt-2">
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? "PROCESSANDO..." : "ABRIR CONTA"}
              </Button>
              <div className="text-sm text-center text-muted-foreground uppercase tracking-wider">
                JÁ É CLIENTE?{" "}
                <Link href="/login" className="text-primary font-semibold hover:text-success transition-colors">
                  ENTRAR
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
