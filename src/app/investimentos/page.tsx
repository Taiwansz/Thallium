import { getInvestments } from "@/actions/investments";
import InvestimentosClient from "./InvestimentosClient";

export default async function InvestimentosPageServer() {
  const investimentos = await getInvestments() || [];

  const totalInvestido = investimentos.reduce((acc, inv) => acc + inv.valor_inicial, 0);
  const totalRendimento = investimentos.reduce((acc, inv) => acc + inv.rendimento, 0);

  return (
    <InvestimentosClient
      investimentos={investimentos}
      totalInvestido={totalInvestido}
      totalRendimento={totalRendimento}
    />
  );
}
