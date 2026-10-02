import { Shell } from "@/components/shell";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <Shell role="admin">{children}</Shell>;
}
