import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "seu@email.com" },
        senha: { label: "Senha", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.senha) {
          throw new Error("Email e senha são obrigatórios");
        }

        const user = await prisma.cliente.findUnique({
          where: { email: credentials.email }
        });

        if (!user) {
          throw new Error("Usuário não encontrado");
        }

        // Handling both plain text (for seed data) and bcrypt hashes
        const isPasswordValid = user.senha.startsWith("$2a$") || user.senha.startsWith("$2b$") || user.senha.startsWith("$2y$")
          ? await bcrypt.compare(credentials.senha, user.senha)
          : credentials.senha === user.senha; // Fallback for simple seeded passwords like 'admin' if not hashed

        if (!isPasswordValid) {
          throw new Error("Senha inválida");
        }

        return {
          id: user.id_cliente.toString(),
          name: user.nome,
          email: user.email,
        };
      }
    })
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET || "default_dev_secret_change_me_in_prod",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
