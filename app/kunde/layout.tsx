import { Shell } from "@/components/shell";

export default function KundeLayout({ children }: LayoutProps<"/kunde">) {
  return <Shell role="kunde">{children}</Shell>;
}
