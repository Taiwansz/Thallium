import { getCards } from "@/actions/cards";
import CartoesClient from "./CartoesClient";

export default async function CartoesPageServer() {
  const cartoes = await getCards();
  return <CartoesClient cartoes={cartoes || []} />;
}
