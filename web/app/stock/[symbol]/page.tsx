import { StockDetail } from "@/components/StockDetail";

export async function generateMetadata({ params }: PageProps<"/stock/[symbol]">) {
  const { symbol } = await params;
  return { title: `${symbol.toUpperCase()} · Stock Market Pro` };
}

export default async function StockPage({ params }: PageProps<"/stock/[symbol]">) {
  const { symbol } = await params;
  return <StockDetail symbol={symbol.toUpperCase()} />;
}
