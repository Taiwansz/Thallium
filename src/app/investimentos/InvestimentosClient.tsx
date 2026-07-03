"use client";

import { useState } from "react";
import { invest, redeemInvestment } from "@/actions/investments";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Activity, ArrowDownToLine, TrendingUp } from "lucide-react";

export default function InvestimentosClient({ investimentos, totalInvestido, totalRendimento }: { investimentos: any[], totalInvestido: number, totalRendimento: number }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInvest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const res = await invest(formData);
    if ("error" in res && res.error) {
      setError(res.error);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20">
      <header>
        <h1 className="text-4xl font-light tracking-widest uppercase">INVESTIMENTOS</h1>
        <p className="text-muted-foreground mt-2 tracking-widest uppercase text-sm">MULTIPLIQUE SEU PATRIMÔNIO COM PRECISÃO.</p>
      </header>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-primary/20 rounded-full blur-[80px]" />
          <CardHeader>
            <CardTitle>CARTEIRA CONSOLIDADA</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8 relative z-10">
             <div className="space-y-2">
                <p className="text-xs text-muted-foreground tracking-widest uppercase">TOTAL INVESTIDO</p>
                <p className="text-5xl font-light tracking-tight">{formatCurrency(totalInvestido)}</p>
             </div>
             <div className="pt-8 border-t border-border/50 space-y-2">
                <p className="text-xs text-muted-foreground tracking-widest uppercase">RENDIMENTO ACUMULADO</p>
                <p className="text-2xl font-mono text-primary tracking-wide">+{formatCurrency(totalRendimento)}</p>
             </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>NOVA APLICAÇÃO</CardTitle>
            <CardDescription>ESPECTRO DE RENDIMENTO 12% A.A.</CardDescription>
          </CardHeader>
          <form onSubmit={handleInvest}>
            <CardContent className="space-y-6">
               {error && <div className="text-sm text-destructive font-semibold border-l-2 border-destructive bg-destructive/10 p-3 tracking-widest uppercase">{error}</div>}
               <div className="space-y-3">
                 <Label htmlFor="tipo">PRODUTO FINANCEIRO</Label>
                 <select id="tipo" name="tipo" className="flex h-12 w-full rounded-sm border border-border bg-background/50 px-4 py-2 text-sm tracking-widest focus-visible:outline-none focus-visible:border-primary uppercase text-foreground cursor-pointer">
                    <option value="CDB">CDB LIQUIDEZ DIÁRIA</option>
                    <option value="LCI">LCI 90 DIAS</option>
                    <option value="Tesouro Selic">TESOURO SELIC</option>
                 </select>
               </div>
               <div className="space-y-3">
                 <Label htmlFor="valor">VALOR (MÍN. R$ 100)</Label>
                 <Input id="valor" name="valor" type="number" step="0.01" min="100" required className="font-mono text-2xl" placeholder="0.00" />
               </div>
            </CardContent>
            <CardFooter>
               <Button type="submit" disabled={loading} className="w-full gap-4 text-lg">
                  {loading ? "PROCESSANDO..." : "CONFIRMAR APLICAÇÃO"}
                  {!loading && <TrendingUp className="w-5 h-5" />}
               </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ACOMPANHAMENTO DE ATIVOS</CardTitle>
        </CardHeader>
        <CardContent>
           {investimentos.length === 0 ? (
             <p className="text-muted-foreground text-sm uppercase tracking-widest">NENHUM ATIVO NA CARTEIRA.</p>
           ) : (
             <div className="space-y-0 divide-y divide-border/50">
                {investimentos.map((inv) => (
                  <div key={inv.id} className="flex flex-col lg:flex-row lg:items-center justify-between p-6 -mx-8 px-8 group hover:bg-secondary/20 transition-colors gap-6">
                     <div className="flex items-center gap-6">
                        <div className="w-12 h-12 border border-border flex items-center justify-center bg-background/50 group-hover:border-primary/50 transition-colors">
                           <Activity className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <div>
                           <h4 className="font-semibold text-lg tracking-widest uppercase">{inv.tipo}</h4>
                           <p className="text-xs text-muted-foreground tracking-widest mt-1">APLICAÇÃO: {formatDate(inv.data_aplicacao)}</p>
                        </div>
                     </div>
                     <div className="flex items-center justify-between lg:justify-end gap-8 flex-1 w-full lg:w-auto">
                        <div className="text-left lg:text-right">
                           <p className="text-xs text-muted-foreground tracking-widest uppercase">SALDO ATUAL</p>
                           <p className="font-mono text-xl tracking-wide">{formatCurrency(inv.valor_atual)}</p>
                           <p className="text-xs font-mono text-primary mt-1 tracking-wider">+{formatCurrency(inv.rendimento)} RENDIMENTO</p>
                        </div>
                        <form action={async () => {
                          await redeemInvestment(inv.id);
                        }}>
                           <Button variant="outline" size="sm" className="gap-2 border-muted-foreground/30 hover:border-primary/50 text-muted-foreground hover:text-primary">
                              RESGATAR
                           </Button>
                        </form>
                     </div>
                  </div>
                ))}
             </div>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
