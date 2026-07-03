"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

export async function requestLoan(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Não autorizado" };

  const valor = parseFloat(formData.get("valor") as string);
  const prazo = parseInt(formData.get("prazo") as string);
  const id_cliente = parseInt(session.user.id);

  if (isNaN(valor) || valor <= 0 || isNaN(prazo) || prazo <= 0) {
    return { error: "Valores inválidos." };
  }

  try {
    const conta = await prisma.conta.findFirst({ where: { id_cliente } });
    if (!conta) return { error: "Conta não encontrada." };

    const juros = 1.05; // 5% de juros
    const data_emprestimo = new Date();
    const data_vencimento = new Date();
    data_vencimento.setFullYear(data_vencimento.getFullYear() + Math.ceil(prazo/12));

    await prisma.emprestimo.create({
      data: {
        numero_conta: conta.numero_conta,
        valor_emprestimo: valor,
        juros,
        prazo,
        data_emprestimo,
        data_vencimento,
        status: 'pendente'
      }
    });

    revalidatePath("/emprestimos");
    return { success: true };
  } catch (error) {
    return { error: "Erro ao solicitar empréstimo." };
  }
}

export async function getLoans() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const id_cliente = parseInt(session.user.id);

  return prisma.emprestimo.findMany({
    where: { conta: { id_cliente } },
    orderBy: { data_emprestimo: 'desc' }
  });
}
