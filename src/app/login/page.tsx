"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const senha = formData.get("senha") as string;

    const res = await signIn("credentials", {
      email,
      senha,
      redirect: false,
    });

    if (res?.error) {
      setError("Email ou senha inválidos.");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background Thallium Emission Glow */}
      <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] rounded-full bg-primary/10 blur-[150px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md z-10"
      >
        <Card>
          <CardHeader className="text-center pb-6">
            <div className="w-12 h-12 bg-secondary border border-border flex items-center justify-center mx-auto mb-6 relative">
               <div className="absolute inset-0 bg-primary/20 blur-md"></div>
               <span className="text-primary font-bold text-xl relative z-10">Tl</span>
            </div>
            <CardTitle>THALLIUM BANK</CardTitle>
            <CardDescription>ACESSE SUA CONTA</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {error && (
                <div className="p-3 text-sm text-destructive font-medium border-l-2 border-destructive bg-destructive/10">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="EX: NOME@EMAIL.COM"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <Input
                  id="senha"
                  name="senha"
                  type="password"
                  required
                  placeholder="••••••••"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-6 pt-2">
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? "AUTENTICANDO..." : "ENTRAR"}
              </Button>
              <div className="text-sm text-center text-muted-foreground uppercase tracking-wider">
                NÃO POSSUI CONTA?{" "}
                <Link href="/cadastro" className="text-primary font-semibold hover:text-success transition-colors">
                  CRIAR AGORA
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
