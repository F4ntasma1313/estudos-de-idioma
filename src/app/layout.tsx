import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "English Journey", description: "Seu inglês avança um pouco a cada dia." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
