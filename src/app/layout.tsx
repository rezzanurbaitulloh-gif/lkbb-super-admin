import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LKBB Super Admin",
  description: "Dasbor super admin platform sewa event LKBB",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
