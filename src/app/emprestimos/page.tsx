import { getLoans } from "@/actions/loans";
import EmprestimosClient from "./EmprestimosClient";

export default async function EmprestimosPageServer() {
  const emprestimos = await getLoans();
  return <EmprestimosClient emprestimos={emprestimos || []} />;
}
