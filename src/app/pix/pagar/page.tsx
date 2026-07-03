"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendPix } from "@/actions/pix";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";

export default function PagarPixPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const res = await sendPix(formData);

    if ("error" in res && res.error) {
      setError(res.error);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <div className="mb-8">
        <Button variant="ghost" asChild className="gap-2 -ml-4 text-muted-foreground hover:text-foreground">
          <Link href="/pix">
            <ArrowLeft className="w-4 h-4" />
            VOLTAR
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>TRANSFERÊNCIA PIX</CardTitle>
          <CardDescription>INFORME OS DADOS PARA O ENVIO</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-8">
            {error && (
              <div className="p-3 text-sm text-destructive font-medium border-l-2 border-destructive bg-destructive/10 uppercase tracking-widest">
                {error}
              </div>
            )}
            <div className="space-y-3">
              <Label htmlFor="chave_dest">CHAVE DE DESTINO</Label>
              <Input id="chave_dest" name="chave_dest" required placeholder="CPF, EMAIL OU CELULAR" className="font-mono text-lg" />
            </div>
            <div className="space-y-3">
              <Label htmlFor="valor">VALOR (R$)</Label>
              <Input id="valor" name="valor" type="number" step="0.01" min="0.01" required placeholder="0.00" className="font-mono text-2xl text-primary" />
            </div>
            <div className="space-y-3">
              <Label htmlFor="senha_transacao">PIN DE SEGURANÇA</Label>
              <Input id="senha_transacao" name="senha_transacao" type="password" maxLength={4} placeholder="••••" className="font-mono text-2xl tracking-[1em]" />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={loading} className="w-full h-14 gap-4 text-lg">
              {loading ? "PROCESSANDO..." : "CONFIRMAR TRANSFERÊNCIA"}
              {!loading && <Send className="w-5 h-5" />}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
