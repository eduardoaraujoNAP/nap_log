import { signIn } from "@/auth";

export default function LoginPage() {
  return <main className="login-page"><section className="login-card"><span className="brand-mark">N</span><p className="eyebrow">NAP LOG</p><h1>Acesse sua operação</h1><p>Entre com sua conta corporativa para continuar.</p><form action={async () => { "use server"; await signIn("keycloak", { redirectTo: "/" }); }}><button className="button primary">Entrar com Keycloak</button></form></section></main>;
}
