import { getDashboardData } from "@/actions/dashboard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wallet, Activity, CreditCard as CreditCardIcon, ArrowRightLeft } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const data = await getDashboardData();

  if (!data) return null;

  const summaryCards = [
    {
      title: "SALDO DISPONÍVEL",
      value: formatCurrency(data.saldo),
      icon: Wallet,
    },
    {
      title: "PATRIMÔNIO TOTAL",
      value: formatCurrency(data.patrimonioTotal),
      icon: Activity,
    },
    {
      title: "FATURA ATUAL",
      value: formatCurrency(data.faturaAtual),
      icon: CreditCardIcon,
    },
  ];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-light tracking-widest uppercase">Olá, {data.nome?.split(" ")[0]}</h1>
        <p className="text-sm text-muted-foreground tracking-widest uppercase">
          CONTA: {data.conta} <span className="mx-2 text-primary">•</span> STATUS: ATIVA
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {summaryCards.map((card, i) => (
          <Card key={i} className="group">
            <CardContent className="p-8">
              <div className="flex justify-between items-start mb-6">
                 <p className="text-xs font-semibold text-muted-foreground tracking-widest uppercase">{card.title}</p>
                 <card.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <h3 className="text-3xl font-light tracking-tight">{card.value}</h3>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">

          <Card>
            <CardHeader>
              <CardTitle>TRANSAÇÕES RECENTES</CardTitle>
              <CardDescription>SEU HISTÓRICO DE MOVIMENTAÇÕES</CardDescription>
            </CardHeader>
            <CardContent>
              {data.transacoes.length === 0 ? (
                <p className="text-muted-foreground text-sm uppercase tracking-widest">Nenhuma transação recente.</p>
              ) : (
                <div className="space-y-0 divide-y divide-border/50">
                  {data.transacoes.map((tx) => (
                    <div key={tx.id_transacao} className="flex items-center justify-between py-5 group hover:bg-secondary/20 transition-colors -mx-8 px-8">
                      <div className="flex items-center gap-6">
                        <div className={`w-10 h-10 border flex items-center justify-center bg-background/50 transition-colors
                          ${tx.valor < 0 ? 'border-destructive/30 text-destructive' : 'border-success/30 text-success'}`}>
                          <ArrowRightLeft className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold tracking-wide uppercase">{tx.descricao || tx.tipo_transacao}</p>
                          <p className="text-xs text-muted-foreground font-mono mt-1">{formatDate(tx.data_transacao)}</p>
                        </div>
                      </div>
                      <span className={`font-mono text-lg ${tx.valor < 0 ? '' : 'text-success'}`}>
                        {tx.valor < 0 ? '-' : '+'}{formatCurrency(Math.abs(tx.valor))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
           <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>AÇÕES RÁPIDAS</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4">
               {[
                  { href: "/pix", label: "TRANSFERÊNCIA PIX" },
                  { href: "/cartoes", label: "GERENCIAR CARTÕES" },
                  { href: "/investimentos", label: "NOVA APLICAÇÃO" },
                  { href: "/emprestimos", label: "SOLICITAR CRÉDITO" },
                ].map((action, i) => (
                  <Link key={i} href={action.href} className="w-full">
                    <div className="w-full p-4 border border-border bg-background/50 hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-between group">
                       <span className="text-xs font-bold tracking-widest uppercase">{action.label}</span>
                       <ArrowRightLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </Link>
                ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
