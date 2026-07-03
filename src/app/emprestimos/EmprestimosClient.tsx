"use client";

import { useState } from "react";
import { requestLoan } from "@/actions/loans";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, Check, AlertCircle } from "lucide-react";

export default function EmprestimosClient({ emprestimos }: { emprestimos: any[] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const res = await requestLoan(formData);
    if (res.error) {
      setError(res.error);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] animate-in fade-in zoom-in duration-500">
        <Card className="max-w-lg w-full text-center border-success/30 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-success/10 rounded-full blur-[100px] pointer-events-none" />
          <CardContent className="pt-16 pb-16 space-y-8 flex flex-col items-center relative z-10">
            <div className="w-20 h-20 rounded-full border-2 border-success flex items-center justify-center bg-success/10">
               <Check className="w-10 h-10 text-success" />
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-light tracking-widest uppercase">SOLICITAÇÃO ENVIADA</h2>
              <p className="text-muted-foreground tracking-widest text-sm uppercase">SEU PEDIDO ENCONTRA-SE EM ANÁLISE SISTÊMICA.</p>
            </div>
            <Button onClick={() => setSuccess(false)} variant="outline" className="mt-8 border-success/30 text-success hover:bg-success/10">
              NOVA SIMULAÇÃO
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20 max-w-6xl mx-auto">
      <header>
        <h1 className="text-4xl font-light tracking-widest uppercase">EMPRÉSTIMOS</h1>
        <p className="text-muted-foreground mt-2 tracking-widest uppercase text-sm">EXPANSÃO DE CAPITAL SOB DEMANDA.</p>
      </header>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        <Card className="lg:sticky lg:top-28">
          <CardHeader>
            <CardTitle>SIMULAÇÃO DE CRÉDITO</CardTitle>
            <CardDescription>CUSTO EFETIVO TOTAL: 5% A.M.</CardDescription>
          </CardHeader>
          <form onSubmit={handleRequest}>
            <CardContent className="space-y-8">
              {error && (
                <div className="p-3 text-sm text-destructive font-semibold border-l-2 border-destructive bg-destructive/10 uppercase tracking-widest flex items-center gap-3">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
              <div className="space-y-3">
                <Label htmlFor="valor">MONTANTE SOLICITADO</Label>
                <Input id="valor" name="valor" type="number" step="0.01" min="100" required className="font-mono text-2xl text-primary" placeholder="0.00" />
              </div>
              <div className="space-y-3">
                <Label htmlFor="prazo">PRAZO (MESES)</Label>
                <Input id="prazo" name="prazo" type="number" min="1" max="72" required className="font-mono text-2xl" placeholder="12" />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={loading} className="w-full h-14 gap-4 text-lg">
                {loading ? "PROCESSANDO..." : "SOLICITAR ANÁLISE"}
                {!loading && <Wallet className="w-5 h-5" />}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="space-y-6">
          <h3 className="text-xl font-light tracking-widest uppercase border-b border-border/50 pb-4">SEU HISTÓRICO</h3>
          {emprestimos.length === 0 ? (
            <div className="p-8 border border-border bg-background/50 text-center">
               <p className="text-muted-foreground text-sm uppercase tracking-widest">NENHUMA SOLICITAÇÃO REGISTRADA.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {emprestimos.map((emp) => (
                <div key={emp.id_emprestimo} className="border border-border bg-background/50 p-6 flex flex-col gap-6 relative overflow-hidden group hover:border-primary/30 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-muted-foreground tracking-widest uppercase">VALOR SOLICITADO</p>
                      <p className="font-mono text-2xl mt-1 tracking-wide">{formatCurrency(emp.valor_emprestimo)}</p>
                    </div>
                    <span className={`px-4 py-2 text-[10px] font-bold tracking-[0.2em] uppercase border
                      ${emp.status === 'pendente' ? 'border-orange-500/30 text-orange-500 bg-orange-500/10' :
                        emp.status === 'aprovado' ? 'border-success/30 text-success bg-success/10' :
                        'border-destructive/30 text-destructive bg-destructive/10'}`}>
                      {emp.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-muted-foreground tracking-widest uppercase border-t border-border/50 pt-4">
                    <p>PRAZO: {emp.prazo}X</p>
                    <p>DATA: {formatDate(emp.data_emprestimo)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
