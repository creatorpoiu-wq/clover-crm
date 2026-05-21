import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clover | Professional CRM & Booking",
  description: "A sleek, powerful CRM for modern professionals. Manage your pipeline, invoices, and contracts in one place.",
  openGraph: {
    title: "Clover | Professional CRM",
    description: "Manage your pipeline, invoices, and contracts seamlessly.",
    url: "https://pipeline-crm-react.vercel.app",
    siteName: "Clover CRM",
    images: [{ url: "/icon.png", width: 800, height: 600 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Clover CRM",
    description: "Sleek CRM for modern professionals.",
    images: ["/icon.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
