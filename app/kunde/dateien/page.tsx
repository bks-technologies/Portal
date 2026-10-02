import { KundeDateien } from "@/components/views/kunde";

export const metadata = { title: "Dateien" };

export default async function Page({ searchParams }: PageProps<"/kunde/dateien">) {
  const { anforderung } = await searchParams;
  return <KundeDateien requestId={typeof anforderung === "string" ? anforderung : undefined} />;
}
