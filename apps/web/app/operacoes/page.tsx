"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { activitiesApi } from "@/lib/api";
import type { ApiActivity, ApiActivityStatus, CreateActivityInput } from "@/lib/types";

const statusLabels: Record<ApiActivityStatus, string> = {
  draft: "Rascunho", awaiting_assignment: "Aguardando atribuição", assigned: "Atribuída",
  accepted: "Aceita", en_route: "Em rota", near_destination: "Próxima", on_site: "No local",
  in_service: "Em atendimento", completed: "Concluída", failed: "Falhou",
  rescheduled: "Reagendada", canceled: "Cancelada", returned: "Retornada",
};


function Status({ value }: { value: ApiActivityStatus }) {
  const tone = value === "completed" ? "concluida" : value === "failed" || value === "canceled" ? "atencao" : value === "awaiting_assignment" || value === "draft" ? "pendente" : value === "on_site" ? "no-local" : "em-rota";
  return <span className={`status status-${tone}`}><i/>{statusLabels[value]}</span>;
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && onClose()}><section className="modal" role="dialog" aria-modal="true" aria-label={title}><header><div><p className="eyebrow">CENTRAL DE OPERAÇÕES</p><h2>{title}</h2></div><button aria-label="Fechar" onClick={onClose}>×</button></header>{children}</section></div>;
}

export default function Operations() {
  const [rows, setRows] = useState<ApiActivity[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [creating, setCreating] = useState(false);
  const [assigning, setAssigning] = useState<ApiActivity>();

  const load = useCallback(async () => {
    setLoading(true); setError(undefined);
    try { setRows(await activitiesApi.list()); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível carregar as atividades."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);
  const filtered = useMemo(() => rows.filter(item => `${item.externalReference ?? ""} ${item.description} ${item.address} ${item.assignedDriverId ?? ""}`.toLowerCase().includes(query.toLowerCase())), [query, rows]);
  const pending = rows.filter(item => item.status === "awaiting_assignment").length;
  const completed = rows.filter(item => item.status === "completed").length;

  async function createActivity(input: CreateActivityInput) {
    setError(undefined); setNotice(undefined);
    try { await activitiesApi.create(input); setCreating(false); setNotice("Atividade criada com sucesso."); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível criar a atividade."); throw reason; }
  }

  async function assignActivity(driverId: string) {
    if (!assigning) return;
    setError(undefined); setNotice(undefined);
    try { await activitiesApi.assign(assigning.id, { driverId }); setAssigning(undefined); setNotice("Motorista atribuído com sucesso."); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível atribuir o motorista."); throw reason; }
  }

  return <div className="page"><div className="page-heading"><div><p className="eyebrow">GESTÃO OPERACIONAL</p><h1>Central de operações</h1><p>Gerencie e acompanhe todas as atividades em um só lugar.</p></div><button className="button primary" onClick={() => setCreating(true)}>＋ Nova atividade</button></div>
    <div className="mode-banner live"><b>API conectada</b><span>Os dados desta tela são carregados do tenant configurado.</span><button onClick={() => void load()} disabled={loading}>↻ Atualizar</button></div>
    {error && <div className="feedback error" role="alert"><span>{error}</span><button onClick={() => setError(undefined)}>×</button></div>}
    {notice && <div className="feedback success" role="status"><span>{notice}</span><button onClick={() => setNotice(undefined)}>×</button></div>}
    <div className="tabs"><button className="active">Todas <span>{rows.length}</span></button><button>Em andamento <span>{Math.max(rows.length - pending - completed, 0)}</span></button><button>Pendentes <span>{pending}</span></button><button>Concluídas <span>{completed}</span></button></div>
    <section className="panel operations-panel"><div className="filters"><label className="search-field">⌕<input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar por referência, descrição ou endereço"/></label><select aria-label="Status"><option>Todos os status</option>{Object.entries(statusLabels).map(([value,label]) => <option key={value}>{label}</option>)}</select><button className="button secondary" onClick={() => void load()}disabled={loading}>↻ Revalidar</button></div><div className="table-wrap"><table><thead><tr><th>Atividade</th><th>Descrição / Destino</th><th>Motorista</th><th>Atualização</th><th>Status</th><th>Ação</th></tr></thead><tbody>{filtered.map(activity => <tr key={activity.id}><td><b>{activity.externalReference || activity.id.slice(0, 8)}</b><small>v{activity.version} · {activity.id.slice(0, 8)}</small></td><td><b>{activity.description}</b><small>{activity.address}</small></td><td>{activity.assignedDriverId ? <span className="uuid-value">{activity.assignedDriverId}</span> : "Não atribuído"}</td><td><b>{new Date(activity.updatedAt).toLocaleDateString("pt-BR")}</b><small>{new Date(activity.updatedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</small></td><td><Status value={activity.status}/></td><td><button className="assign-button"disabled={activity.status !== "awaiting_assignment"} onClick={() => setAssigning(activity)}>Atribuir</button></td></tr>)}</tbody></table>{loading && <div className="empty loading-state"><i/>Carregando atividades...</div>}{!loading && filtered.length === 0 && <div className="empty">Nenhuma atividade encontrada.</div>}</div><footer className="pagination"><span>Mostrando {filtered.length} de {rows.length} atividades</span><div><button disabled>‹</button><button className="current">1</button><button disabled>›</button></div></footer></section>
    {creating && <CreateModal onClose={() => setCreating(false)} onSubmit={createActivity}/>} {assigning && <AssignModal activity={assigning} onClose={() => setAssigning(undefined)} onSubmit={assignActivity}/>} 
  </div>;
}

function CreateModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (input: CreateActivityInput) => Promise<void> }) {
  const [saving, setSaving] = useState(false); const [localError, setLocalError] = useState<string>();
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); const input = { externalReference: String(data.get("externalReference") || "").trim() || undefined, description: String(data.get("description") || "").trim(), address: String(data.get("address") || "").trim() }; if (input.description.length < 3 || input.address.length < 5) { setLocalError("Informe uma descrição (mín. 3) e um endereço (mín. 5 caracteres)."); return; } setSaving(true); setLocalError(undefined); try { await onSubmit(input); } catch {} finally { setSaving(false); } }
  return <Modal title="Nova atividade" onClose={onClose}><form className="activity-form" onSubmit={submit}><label>Referência externa <small>Opcional</small><input name="externalReference" maxLength={120} placeholder="ERP-123"/></label><label>Descrição<textarea name="description" required minLength={3} maxLength={500} placeholder="Entregar pedido 123"/></label><label>Endereço completo<textarea name="address" required minLength={5} maxLength={500} placeholder="Av. Paulista, 1000, São Paulo - SP"/></label>{localError && <p className="form-error">{localError}</p>}<footer><button type="button" className="button secondary" onClick={onClose}>Cancelar</button><button className="button primary" disabled={saving}>{saving ? "Criando..." : "Criar atividade"}</button></footer></form></Modal>;
}

function AssignModal({ activity, onClose, onSubmit }: { activity: ApiActivity; onClose: () => void; onSubmit: (driverId: string) => Promise<void> }) {
  const [saving, setSaving] = useState(false); const [localError, setLocalError] = useState<string>();
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const driverId = String(new FormData(event.currentTarget).get("driverId") || "").trim(); if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(driverId)) { setLocalError("Informe um UUID de motorista válido."); return; } setSaving(true); setLocalError(undefined); try { await onSubmit(driverId); } catch {} finally { setSaving(false); } }
  return <Modal title="Atribuir motorista" onClose={onClose}><form className="activity-form" onSubmit={submit}><div className="activity-summary"><b>{activity.externalReference || activity.id.slice(0, 8)}</b><span>{activity.description}</span><small>{activity.address}</small></div><label>UUID do motorista<input name="driverId" required autoFocus placeholder="00000000-0000-4000-8000-000000000000"/></label>{localError && <p className="form-error">{localError}</p>}<footer><button type="button" className="button secondary" onClick={onClose}>Cancelar</button><button className="button primary" disabled={saving}>{saving ? "Atribuindo..." : "Confirmar atribuição"}</button></footer></form></Modal>;
}
