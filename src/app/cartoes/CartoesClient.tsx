"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { toggleCardBlock, payInvoice } from "@/actions/cards";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Unlock, ShieldAlert, CreditCard } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function CartoesClient({ cartoes }: { cartoes: any[] }) {
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [payingId, setPayingId] = useState<number | null>(null);

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20">
      <header>
        <h1 className="text-4xl font-light tracking-widest uppercase">CARTÕES</h1>
        <p className="text-muted-foreground mt-2 tracking-widest uppercase text-sm">CONTROLE DE LIMITES E SEGURANÇA.</p>
      </header>

      {cartoes?.length === 0 ? (
        <p className="text-muted-foreground uppercase tracking-widest text-sm">NENHUM CARTÃO ENCONTRADO.</p>
      ) : (
        <div className="grid xl:grid-cols-2 gap-12">
          {cartoes.map((cartao) => (
            <Card key={cartao.id} className="relative overflow-hidden group">
              {cartao.bloqueado && (
                <div className="absolute inset-0 bg-background/90 backdrop-blur-md z-20 flex flex-col items-center justify-center border border-destructive">
                  <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
                  <h3 className="text-2xl font-light tracking-widest text-destructive uppercase">CARTÃO BLOQUEADO</h3>
                  <Button
                    variant="outline"
                    className="mt-8 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground pointer-events-auto z-30"
                    onClick={async () => {
                      setLoadingId(cartao.id);
                      await toggleCardBlock(cartao.id, true);
                      setLoadingId(null);
                    }}
                    disabled={loadingId === cartao.id}
                  >
                    {loadingId === cartao.id ? "PROCESSANDO..." : "DESBLOQUEAR CARTÃO"}
                  </Button>
                </div>
              )}

              <div className="p-10 pb-6 relative">
                 <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-primary/10 rounded-full blur-[80px]" />
                 <div className="flex justify-between items-start relative z-10">
                   <div className="flex items-center gap-3">
                      <CreditCard className="w-8 h-8 text-muted-foreground" />
                      <span className="text-sm font-semibold tracking-widest text-foreground">THALLIUM INFINITE</span>
                   </div>
                   <div className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold tracking-widest border border-primary/20">
                     VIRTUAL
                   </div>
                 </div>
                 <div className="mt-12 relative z-10">
                   <p className="font-mono text-3xl tracking-[0.2em] text-foreground/90">
                     •••• •••• •••• {cartao.numero.slice(-4)}
                   </p>
                   <div className="flex gap-8 mt-4 text-sm text-muted-foreground font-mono tracking-wider">
                     <span>VAL {cartao.validade}</span>
                     <span>CVC ***</span>
                   </div>
                 </div>
              </div>

              <CardContent className="pt-8 space-y-8 relative z-10 border-t border-border/50">
                <div className="flex justify-between text-sm">
                  <div className="space-y-2">
                    <p className="text-muted-foreground tracking-widest uppercase text-xs">LIMITE DISPONÍVEL</p>
                    <p className="font-light text-success text-2xl tracking-wide">{formatCurrency(cartao.limite_total - cartao.limite_usado)}</p>
                  </div>
                  <div className="space-y-2 text-right">
                    <p className="text-muted-foreground tracking-widest uppercase text-xs">FATURA ATUAL</p>
                    <p className="font-light text-foreground text-2xl tracking-wide">{formatCurrency(cartao.limite_usado)}</p>
                  </div>
                </div>

                <div className="w-full bg-secondary h-1 overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,230,118,0.8)]"
                    style={{ width: `${(cartao.limite_usado / cartao.limite_total) * 100}%` }}
                  />
                </div>
              </CardContent>

              <CardFooter className="flex flex-col items-start pt-8 gap-6 relative z-10">
                <div className="w-full flex flex-col sm:flex-row justify-between gap-4">
                  <Button
                    variant="outline"
                    className="flex-1 border-muted-foreground/30 text-muted-foreground hover:border-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={async () => {
                      setLoadingId(cartao.id);
                      await toggleCardBlock(cartao.id, false);
                      setLoadingId(null);
                    }}
                    disabled={loadingId === cartao.id}
                  >
                    BLOQUEAR CARTÃO
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => setPayingId(payingId === cartao.id ? null : cartao.id)}
                    disabled={cartao.limite_usado <= 0}
                  >
                    PAGAR FATURA
                  </Button>
                </div>

                {payingId === cartao.id && (
                  <form action={async (formData) => {
                    await payInvoice(formData);
                    setPayingId(null);
                  }} className="w-full flex gap-4 mt-4 animate-in fade-in slide-in-from-top-4">
                    <input type="hidden" name="id_cartao" value={cartao.id} />
                    <Input
                      name="valor"
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={cartao.limite_usado}
                      defaultValue={cartao.limite_usado}
                      className="font-mono text-xl"
                    />
                    <Button type="submit" variant="default" className="px-8">CONFIRMAR</Button>
                  </form>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
