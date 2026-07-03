"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

export async function getInvestments() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const id_cliente = parseInt(session.user.id);

  const investimentos = await prisma.investimento.findMany({
    where: { id_cliente, resgatado: false }
  });

  return investimentos.map(inv => {
    const dias_corridos = Math.floor((new Date().getTime() - new Date(inv.data_aplicacao).getTime()) / (1000 * 3600 * 24));
    const taxa_diaria = (inv.taxa_anual / 100) / 365;
    const rendimento = inv.valor_inicial * (taxa_diaria * dias_corridos);
    const valor_atual = inv.valor_inicial + rendimento;

    return {
      ...inv,
      valor_atual,
      rendimento
    };
  });
}

export async function invest(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Não autorizado" };

  const tipo = formData.get("tipo") as string;
  const valor = parseFloat(formData.get("valor") as string);
  const id_cliente = parseInt(session.user.id);

  if (isNaN(valor) || valor < 100) return { error: "Valor mínimo de R$ 100,00" };

  try {
    return await prisma.$transaction(async (tx) => {
      const conta = await tx.conta.findFirst({ where: { id_cliente } });
      if (!conta || conta.saldo < valor) throw new Error("Saldo insuficiente");

      await tx.conta.update({
        where: { numero_conta: conta.numero_conta },
        data: { saldo: { decrement: valor } }
      });

      await tx.investimento.create({
        data: {
          id_cliente,
          tipo,
          valor_inicial: valor,
          taxa_anual: 12.0 // simulated 12% a.a.
        }
      });

      await tx.transacao.create({
        data: {
          numero_conta: conta.numero_conta,
          tipo_transacao: 'Aplicação',
          valor: -valor,
          descricao: `Investimento em ${tipo}`,
          categoria: 'Investimentos'
        }
      });

      revalidatePath("/investimentos");
      revalidatePath("/dashboard");
      return { success: true };
    });
  } catch (error: any) {
    return { error: error.message || "Erro ao investir." };
  }
}

export async function redeemInvestment(id: number) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Não autorizado" };
  const id_cliente = parseInt(session.user.id);

  try {
    return await prisma.$transaction(async (tx) => {
      const inv = await tx.investimento.findUnique({ where: { id, id_cliente } });
      if (!inv || inv.resgatado) throw new Error("Investimento não encontrado ou já resgatado");

      const dias_corridos = Math.floor((new Date().getTime() - new Date(inv.data_aplicacao).getTime()) / (1000 * 3600 * 24));
      const taxa_diaria = (inv.taxa_anual / 100) / 365;
      const rendimento = inv.valor_inicial * (taxa_diaria * dias_corridos);
      const valor_final = inv.valor_inicial + rendimento;

      const conta = await tx.conta.findFirst({ where: { id_cliente } });
      if (!conta) throw new Error("Conta não encontrada");

      await tx.conta.update({
        where: { numero_conta: conta.numero_conta },
        data: { saldo: { increment: valor_final } }
      });

      await tx.investimento.update({
        where: { id },
        data: { resgatado: true }
      });

      await tx.transacao.create({
        data: {
          numero_conta: conta.numero_conta,
          tipo_transacao: 'Resgate',
          valor: valor_final,
          descricao: `Resgate ${inv.tipo}`,
          categoria: 'Investimentos'
        }
      });

      revalidatePath("/investimentos");
      revalidatePath("/dashboard");
      return { success: true, valor_resgatado: valor_final };
    });
  } catch (error: any) {
    return { error: error.message || "Erro ao resgatar." };
  }
}
