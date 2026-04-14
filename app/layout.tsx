import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kaplan Family Tree",
  description: "A living family tree with collaborative invites and relationship mapping."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
