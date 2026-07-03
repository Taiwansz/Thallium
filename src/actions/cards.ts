"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

export async function getCards() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const id_cliente = parseInt(session.user.id);
  return prisma.cartao.findMany({ where: { id_cliente } });
}

export async function toggleCardBlock(id: number, currentStatus: boolean) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Não autorizado" };

  try {
    await prisma.cartao.update({
      where: { id, id_cliente: parseInt(session.user.id) },
      data: { bloqueado: !currentStatus }
    });
    revalidatePath("/cartoes");
    return { success: true };
  } catch (error) {
    return { error: "Erro ao atualizar status do cartão." };
  }
}

export async function payInvoice(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Não autorizado" };

  const id_cartao = parseInt(formData.get("id_cartao") as string);
  const valor = parseFloat(formData.get("valor") as string);
  const id_cliente = parseInt(session.user.id);

  if (isNaN(valor) || valor <= 0) return { error: "Valor inválido" };

  try {
    return await prisma.$transaction(async (tx) => {
      const cartao = await tx.cartao.findUnique({ where: { id: id_cartao, id_cliente } });
      if (!cartao) throw new Error("Cartão não encontrado");
      if (valor > cartao.limite_usado) throw new Error("Valor maior que a fatura");

      const conta = await tx.conta.findFirst({ where: { id_cliente } });
      if (!conta || conta.saldo < valor) throw new Error("Saldo insuficiente na conta");

      await tx.conta.update({
        where: { numero_conta: conta.numero_conta },
        data: { saldo: { decrement: valor } }
      });

      await tx.cartao.update({
        where: { id: id_cartao },
        data: { limite_usado: { decrement: valor } }
      });

      await tx.transacao.create({
        data: {
          numero_conta: conta.numero_conta,
          tipo_transacao: 'Pagamento Fatura',
          valor: -valor,
          descricao: `Pagamento Cartão final ${cartao.numero.slice(-4)}`,
          categoria: 'Pagamentos'
        }
      });

      revalidatePath("/cartoes");
      revalidatePath("/dashboard");
      return { success: true };
    });
  } catch (error: any) {
    return { error: error.message || "Erro ao pagar fatura." };
  }
}
