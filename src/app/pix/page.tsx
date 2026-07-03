import { getPixKeys } from "@/actions/pix";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { deletePixKey } from "@/actions/pix";

export default async function PixDashboard() {
  const chaves = await getPixKeys();

  return (
    <div className="space-y-12 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <header>
        <h1 className="text-4xl font-light tracking-widest uppercase">ÁREA PIX</h1>
        <p className="text-muted-foreground mt-2 tracking-widest uppercase text-sm">TRANSAÇÕES INSTANTÂNEAS COM PRECISÃO.</p>
      </header>

      <div className="grid md:grid-cols-2 gap-8">
        <Link href="/pix/pagar">
          <Card className="hover:border-primary/50 transition-all cursor-pointer h-full group">
            <CardContent className="p-12 flex flex-col items-center justify-center text-center gap-6 h-full">
              <div className="w-16 h-16 border border-border flex items-center justify-center group-hover:border-primary/50 transition-colors relative">
                 <div className="absolute inset-0 bg-primary/10 blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
                 <ArrowRightLeft className="w-6 h-6 text-muted-foreground group-hover:text-primary relative z-10 transition-colors" />
              </div>
              <div>
                <h3 className="text-xl font-light tracking-widest uppercase">REALIZAR TRANSFERÊNCIA</h3>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/pix/nova-chave">
          <Card className="hover:border-primary/50 transition-all cursor-pointer h-full group">
            <CardContent className="p-12 flex flex-col items-center justify-center text-center gap-6 h-full">
              <div className="w-16 h-16 border border-border flex items-center justify-center group-hover:border-primary/50 transition-colors relative">
                 <div className="absolute inset-0 bg-primary/10 blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
                 <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary relative z-10 transition-colors" />
              </div>
              <div>
                <h3 className="text-xl font-light tracking-widest uppercase">CADASTRAR CHAVE</h3>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>MINHAS CHAVES</CardTitle>
          <CardDescription>GERENCIE SEUS ACESSOS DE RECEBIMENTO</CardDescription>
        </CardHeader>
        <CardContent>
          {!chaves || chaves.length === 0 ? (
            <p className="text-muted-foreground text-sm uppercase tracking-widest">Nenhuma chave cadastrada.</p>
          ) : (
            <div className="space-y-4">
              {chaves.map((chave) => (
                <div key={chave.id} className="flex items-center justify-between p-6 border border-border bg-background/50 hover:border-primary/30 transition-colors group">
                  <div>
                    <span className="text-xs uppercase tracking-widest text-primary font-semibold">{chave.tipo}</span>
                    <p className="font-mono text-lg mt-2 tracking-wide">{chave.chave}</p>
                  </div>
                  <form action={async () => {
                    "use server";
                    await deletePixKey(chave.id);
                  }}>
                    <Button variant="ghost" size="icon" className="text-muted-foreground group-hover:text-destructive">
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
