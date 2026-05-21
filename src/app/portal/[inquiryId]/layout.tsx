import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Client Portal | Clover CRM",
  description: "Securely view your contracts, invoices, and project status.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
