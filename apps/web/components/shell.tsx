"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { Icon, type IconName } from "./icons";

const navigation: ReadonlyArray<readonly [string, string, IconName]> = [
  ["/", "Visão geral", "grid"],
  ["/operacoes", "Operações", "list"],
  ["/mapa", "Mapa ao vivo", "map"],
  ["/planejamento", "Planejamento", "route"],
  ["/motoristas", "Motoristas", "users"],
];

export function Shell({ children, devBypass = false }: { children: React.ReactNode; devBypass?: boolean }) {
  const path = usePathname();
  const { data: session, status } = useSession();
  const displayName = session?.user?.name ?? (devBypass ? "Usuário Demo" : "Usuário");
  const initials = displayName.split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase();
  return <div className="app-shell">
    <aside className="sidebar">
      <Link href="/" className="brand"><span className="brand-mark">N</span><span>NAP<span>LOG</span></span></Link>
      <nav>{navigation.map(([href, label, icon]) => <Link key={href} href={href} className={path === href ? "active" : ""}><Icon name={icon}/><span>{label}</span></Link>)}</nav>
      <div className="sidebar-bottom"><Link href="/configuracoes"><Icon name="settings"/><span>Configurações</span></Link><div className="help-card"><strong>Precisa de ajuda?</strong><span>Acesse nossa central de suporte.</span><button>Falar com suporte</button></div></div>
    </aside>
    <div className="main-area">
      <header className="topbar"><div className="mobile-brand"><span className="brand-mark">N</span><b>NAPLOG</b></div><div className="top-search"><Icon name="search" size={18}/><input aria-label="Busca global" placeholder="Buscar atividade, motorista..."/><kbd>⌘ K</kbd></div><div className="top-actions"><button className="icon-button" aria-label="Notificações"><Icon name="bell"/><i/></button><div className="profile"><span>{status === "loading" ? "…" : initials}</span><div><b>{status === "loading" ? "Carregando sessão" : displayName}</b><small>{devBypass && !session ? "Autenticação local" : session?.user?.email ?? "Sessão protegida"}</small></div>{devBypass ? <button className="session-action" disabled>Modo local</button> : <button className="session-action" onClick={() => session ? void signOut({ callbackUrl: "/login" }) : void signIn("keycloak")}>{session ? "Sair" : "Entrar"}</button>}</div></div></header>
      <main>{children}</main>
      <nav className="mobile-nav">{navigation.slice(0,4).map(([href, label, icon]) => <Link key={href} href={href} className={path === href ? "active" : ""}><Icon name={icon}/><small>{label.split(" ")[0]}</small></Link>)}</nav>
    </div>
  </div>;
}
