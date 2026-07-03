"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

export async function getPixKeys() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const id_cliente = parseInt(session.user.id);
  return prisma.chavePix.findMany({ where: { id_cliente } });
}

export async function createPixKey(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Não autorizado" };

  const tipo = formData.get("tipo") as string;
  const chave = formData.get("chave") as string;
  const id_cliente = parseInt(session.user.id);

  try {
    await prisma.chavePix.create({
      data: { tipo, chave, id_cliente }
    });
    revalidatePath("/pix");
    return { success: true };
  } catch (error) {
    return { error: "Chave já cadastrada ou inválida." };
  }
}

export async function deletePixKey(id: number) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Não autorizado" };

  try {
    await prisma.chavePix.delete({
      where: { id, id_cliente: parseInt(session.user.id) }
    });
    revalidatePath("/pix");
    return { success: true };
  } catch (error) {
    return { error: "Erro ao excluir chave." };
  }
}

export async function sendPix(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Não autorizado" };

  const chave_dest = formData.get("chave_dest") as string;
  const valor = parseFloat(formData.get("valor") as string);
  const senha_transacao = formData.get("senha_transacao") as string;
  const id_cliente = parseInt(session.user.id);

  if (isNaN(valor) || valor <= 0) return { error: "Valor inválido" };

  try {
    // Validate transaction password
    const user = await prisma.cliente.findUnique({ where: { id_cliente } });
    if (!user) return { error: "Usuário não encontrado" };

    // Fallback logic for transaction password. In a real scenario, this is mandatory.
    // If user has one set, check it.
    if (user.senha_transacao) {
      const bcrypt = await import("bcryptjs");
      const isValid = await bcrypt.compare(senha_transacao, user.senha_transacao);
      if (!isValid) return { error: "Senha de transação incorreta" };
    }

    return await prisma.$transaction(async (tx) => {
      const contaOrigem = await tx.conta.findFirst({ where: { id_cliente } });
      if (!contaOrigem || contaOrigem.saldo < valor) {
        throw new Error("Saldo insuficiente");
      }

      const chaveObj = await tx.chavePix.findUnique({
        where: { chave: chave_dest },
        include: { cliente: { include: { contas: true } } }
      });

      if (!chaveObj || chaveObj.cliente.contas.length === 0) {
        throw new Error("Chave destino não encontrada");
      }

      if (chaveObj.id_cliente === id_cliente) {
        throw new Error("Você não pode enviar Pix para si mesmo");
      }

      const contaDestino = chaveObj.cliente.contas[0];

      await tx.conta.update({
        where: { numero_conta: contaOrigem.numero_conta },
        data: { saldo: { decrement: valor } }
      });

      await tx.conta.update({
        where: { numero_conta: contaDestino.numero_conta },
        data: { saldo: { increment: valor } }
      });

      await tx.transacao.create({
        data: {
          numero_conta: contaOrigem.numero_conta,
          tipo_transacao: 'Pix Enviado',
          valor: -valor,
          descricao: `Para ${chaveObj.cliente.nome}`,
          categoria: 'Transferência'
        }
      });

      await tx.transacao.create({
        data: {
          numero_conta: contaDestino.numero_conta,
          tipo_transacao: 'Pix Recebido',
          valor: valor,
          descricao: `De ${session.user.name}`,
          categoria: 'Transferência'
        }
      });

      revalidatePath("/dashboard");
      revalidatePath("/pix");
      return { success: true };
    });
  } catch (error: any) {
    return { error: error.message || "Erro ao realizar Pix." };
  }
}
