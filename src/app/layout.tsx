import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "12Weeks - 1 Ano em 12 Semanas | Transforme seus objetivos",
  description: "Transforme seus objetivos anuais em um plano intensivo de 12 semanas. Foque, execute e alcance resultados extraordinários em tempo recorde.",
  keywords: ["objetivos", "planejamento", "produtividade", "12 semanas", "metas", "resultados"],
  authors: [{ name: "12Weeks Team" }],
  openGraph: {
    title: "12Weeks - 1 Ano em 12 Semanas",
    description: "Transforme seus objetivos anuais em resultados extraordinários em apenas 12 semanas",
    type: "website",
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
    title: "12Weeks - 1 Ano em 12 Semanas",
    description: "Transforme seus objetivos anuais em resultados extraordinários em apenas 12 semanas",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
