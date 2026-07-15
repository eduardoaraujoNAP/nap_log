import type { Metadata } from "next";
import { Shell } from "@/components/shell";
import { AuthSessionProvider } from "@/components/session-provider";
import "./globals.css";

export const metadata: Metadata = { title: "NAPLOG · Operação logística", description: "Controle logístico em tempo real" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const devBypass = process.env.NODE_ENV === "development" && process.env.DEV_AUTH_BYPASS === "true";
  return <html lang="pt-BR"><body><AuthSessionProvider><Shell devBypass={devBypass}>{children}</Shell></AuthSessionProvider></body></html>;
}
