"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { activitiesApi } from "@/lib/api";
import type { ApiActivity, ApiActivityStatus } from "@/lib/types";

const labels: Record<ApiActivityStatus, string> = {
  draft: "Rascunho", awaiting_assignment: "Aguardando atribuição", assigned: "Atribuída",
  accepted: "Aceita", en_route: "Em rota", near_destination: "Próxima", on_site: "No local",
  in_service: "Em atendimento", completed: "Concluída", failed: "Falhou",
  rescheduled: "Reagendada", canceled: "Cancelada", returned: "Retornada",
};
const activeStates = new Set<ApiActivityStatus>(["assigned", "accepted", "en_route", "near_destination", "on_site", "in_service"]);
const attentionStates = new Set<ApiActivityStatus>(["failed", "canceled", "returned"]);

export default function Dashboard() {
  const [activities, setActivities] = useState<ApiActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  useEffect(() => { activitiesApi.list().then(setActivities).catch(reason => setError(reason instanceof Error ? reason.message : "Falha ao carregar a operação.")).finally(() => setLoading(false)); }, []);
  const today = useMemo(() => new Date(), []);
  const todays = useMemo(() => activities.filter(item => { const date = new Date(item.createdAt); return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate(); }), [activities, today]);
  const completed = todays.filter(item => item.status === "completed").length;
  const active = todays.filter(item => activeStates.has(item.status)).length;
  const attention = todays.filter(item => attentionStates.has(item.status)).length;
  const pending = todays.filter(item => item.status === "awaiting_assignment" || item.status === "draft").length;
  const recent = [...activities].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).slice(0, 8);
  const hourly = Array.from({ length: 24 }, (_, hour) => ({ hour, count: todays.filter(item => item.status === "completed" && new Date(item.updatedAt).getHours() === hour).length })).filter(item => item.hour >= 6 && item.hour <= 22);
  const maxHourly = Math.max(1, ...hourly.map(item => item.count));
  const metrics = [
    { label: "Atividades hoje", value: todays.length, detail: `${pending} aguardando atribuição`, tone: "blue", icon: "▦" },
    { label: "Concluídas", value: completed, detail: todays.length ? `${Math.round(completed / todays.length * 100)}% da operação` : "Sem atividades hoje", tone: "green", icon: "✓" },
    { label: "Em andamento", value: active, detail: "Estados operacionais ativos", tone: "purple", icon: "↗" },
    { label: "Precisam de atenção", value: attention, detail: "Falhas, cancelamentos ou retornos", tone: "orange", icon: "!" },
  ];
  return <div className="page">
    <div className="page-heading"><div><p className="eyebrow">{today.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" }).toUpperCase()}</p><h1>Visão geral da operação</h1><p>Indicadores calculados diretamente das atividades registradas.</p></div><Link href="/operacoes" className="button primary">＋ Nova atividade</Link></div>
    {error && <div className="feedback error" role="alert"><span>{error}</span></div>}
    <section className="metric-grid">{metrics.map(item => <article className={`metric-card ${item.tone}`} key={item.label}><div className="metric-top"><span className="metric-icon">{item.icon}</span></div><strong>{loading ? "…" : item.value}</strong><h3>{item.label}</h3><p>{item.detail}</p></article>)}</section>
    <section className="dashboard-grid">
      <article className="panel chart-panel"><div className="panel-heading"><div><h2>Conclusões por hora</h2><p>Dados confirmados da operação de hoje</p></div></div><div className="real-chart">{hourly.map(item => <div className="real-chart-column" key={item.hour}><div className="real-chart-value">{item.count || ""}</div><div className="real-chart-bar" style={{ height: `${Math.max(3, item.count / maxHourly * 140)}px` }}/><small>{String(item.hour).padStart(2, "0")}h</small></div>)}</div></article>
      <article className="panel drivers-panel"><div className="panel-heading"><div><h2>Distribuição por status</h2><p>{activities.length} atividades cadastradas</p></div></div><div className="status-summary">{Object.entries(labels).map(([status, label]) => { const count = activities.filter(item => item.status === status).length; return count ? <div key={status}><span>{label}</span><strong>{count}</strong></div> : null; })}{!loading && activities.length === 0 && <p className="empty">Nenhuma atividade cadastrada.</p>}</div></article>
    </section>
    <section className="panel recent"><div className="panel-heading"><div><h2>Atividades recentes</h2><p>Últimas atualizações persistidas</p></div><Link href="/operacoes">Ver todas →</Link></div><div className="table-wrap"><table><thead><tr><th>Atividade</th><th>Descrição / destino</th><th>Motorista</th><th>Atualização</th><th>Status</th></tr></thead><tbody>{recent.map(activity => <tr key={activity.id}><td><b>{activity.externalReference || activity.id.slice(0, 8)}</b><small>v{activity.version}</small></td><td><b>{activity.description}</b><small>{activity.address}</small></td><td>{activity.assignedDriverId || "Não atribuído"}</td><td>{new Date(activity.updatedAt).toLocaleString("pt-BR")}</td><td><span className="status"><i/>{labels[activity.status]}</span></td></tr>)}</tbody></table>{!loading && recent.length === 0 && <div className="empty">Nenhuma atividade encontrada.</div>}</div></section>
  </div>;
}
