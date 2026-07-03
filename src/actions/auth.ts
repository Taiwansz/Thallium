"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const cadastroSchema = z.object({
  nome: z.string().min(2, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  cpf: z.string().min(11, "CPF inválido").max(11, "CPF inválido"),
  senha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

function gerarNumeroCartao() {
  return Array.from({ length: 16 }, () => Math.floor(Math.random() * 10)).join("");
}

export async function cadastrarCliente(formData: FormData) {
  try {
    const parsed = cadastroSchema.parse({
      nome: formData.get("nome"),
      email: formData.get("email"),
      cpf: formData.get("cpf"),
      senha: formData.get("senha"),
    });

    const existingUser = await prisma.cliente.findFirst({
      where: {
        OR: [
          { email: parsed.email },
          { cpf: parsed.cpf }
        ]
      }
    });

    if (existingUser) {
      return { error: "CPF ou Email já cadastrado." };
    }

    const senhaHash = await bcrypt.hash(parsed.senha, 10);

    const result = await prisma.$transaction(async (tx) => {
      const novoCliente = await tx.cliente.create({
        data: {
          nome: parsed.nome,
          email: parsed.email,
          cpf: parsed.cpf,
          senha: senhaHash,
        }
      });

      const saldoInicial = Number((Math.random() * (10380 - 257) + 257).toFixed(2));
      await tx.conta.create({
        data: {
          id_cliente: novoCliente.id_cliente,
          saldo: saldoInicial,
          data_abertura: new Date(),
          tipo_conta: "Corrente",
        }
      });

      let numeroCartao = gerarNumeroCartao();
      let cartaoExistente = await tx.cartao.findUnique({ where: { numero: numeroCartao } });
      while (cartaoExistente) {
        numeroCartao = gerarNumeroCartao();
        cartaoExistente = await tx.cartao.findUnique({ where: { numero: numeroCartao } });
      }

      const validade = `${String(Math.floor(Math.random() * 12) + 1).padStart(2, "0")}/${Math.floor(Math.random() * 5) + 25}`;
      const cvv = String(Math.floor(Math.random() * 900) + 100);

      await tx.cartao.create({
        data: {
          numero: numeroCartao,
          validade: validade,
          cvv: cvv,
          id_cliente: novoCliente.id_cliente,
          limite_total: 15000.00,
        }
      });

      return novoCliente;
    });

    return { success: true, userId: result.id_cliente };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message };
    }
    return { error: "Erro ao cadastrar cliente." };
  }
}
