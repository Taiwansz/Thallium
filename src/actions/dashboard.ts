"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function getDashboardData() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const id_cliente = parseInt(session.user.id);

  const [conta, investimentos, cartoes, transacoes] = await Promise.all([
    prisma.conta.findFirst({ where: { id_cliente } }),
    prisma.investimento.findMany({ where: { id_cliente, resgatado: false } }),
    prisma.cartao.findMany({ where: { id_cliente } }),
    prisma.transacao.findMany({
      where: { conta: { id_cliente } },
      orderBy: { data_transacao: 'desc' },
      take: 5
    })
  ]);

  const saldo = conta?.saldo || 0;
  const totalInvestido = investimentos.reduce((acc, inv) => acc + inv.valor_inicial, 0);
  const patrimonioTotal = saldo + totalInvestido;
  const faturaAtual = cartoes.reduce((acc, cartao) => acc + cartao.limite_usado, 0);

  return {
    saldo,
    totalInvestido,
    patrimonioTotal,
    faturaAtual,
    transacoes,
    nome: session.user.name,
    conta: conta?.numero_conta
  };
}
