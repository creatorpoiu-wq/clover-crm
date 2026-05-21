import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book Now | Clover CRM",
  description: "Secure your spot effortlessly using our streamlined booking funnel.",
  openGraph: {
    title: "Book Your Session",
    description: "Choose a package, schedule a time, and secure your booking in minutes.",
    url: "https://pipeline-crm-react.vercel.app/booking",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Book Your Session",
    description: "Choose a package, schedule a time, and secure your booking in minutes.",
  },
};

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
