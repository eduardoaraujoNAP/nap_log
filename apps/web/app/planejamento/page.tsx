"use client";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { activitiesApi, fleetApi, routesApi } from "@/lib/api";
import type { ApiActivity, DriverRecord, PlannedRoute } from "@/lib/types";
export default function Planning() {
  const [routes, setRoutes] = useState<PlannedRoute[]>([]),
    [activities, setActivities] = useState<ApiActivity[]>([]),
    [drivers, setDrivers] = useState<DriverRecord[]>([]);
  const [selected, setSelected] = useState<string[]>([]),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [error, setError] = useState<string>(),
    [notice, setNotice] = useState<string>();
  const available = useMemo(
    () => activities.filter((a) => a.status === "awaiting_assignment"),
    [activities],
  );
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, a, d] = await Promise.all([
        routesApi.list(),
        activitiesApi.list(),
        fleetApi.drivers(),
      ]);
      setRoutes(r);
      setActivities(a);
      setDrivers(d);
      setError(undefined);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível carregar o planejamento.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }
  function move(id: string, direction: -1 | 1) {
    setSelected((current) => {
      const index = current.indexOf(id),
        next = index + direction;
      if (index < 0 || next < 0 || next >= current.length) return current;
      const copy = [...current];
      [copy[index], copy[next]] = [copy[next], copy[index]];
      return copy;
    });
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget,
      data = new FormData(form);
    if (!selected.length) {
      setError("Selecione ao menos uma atividade.");
      return;
    }
    setSaving(true);
    setError(undefined);
    setNotice(undefined);
    try {
      await routesApi.create({
        name: String(data.get("name")),
        plannedDate: String(data.get("plannedDate")),
        driverId: String(data.get("driverId")),
        activityIds: selected,
      });
      setSelected([]);
      setNotice("Rota planejada e atividades atribuídas com sucesso.");
      form.reset();
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível criar a rota.",
      );
    } finally {
      setSaving(false);
    }
  }
  async function transition(route: PlannedRoute) {
    const action =
      route.status === "planned"
        ? "publish"
        : route.status === "published"
          ? "start"
          : "complete";
    setSaving(true);
    setError(undefined);
    setNotice(undefined);
    try {
      await routesApi.transition(route.id, action);
      setNotice(
        action === "publish"
          ? "Rota publicada para o motorista."
          : action === "start"
            ? "Rota iniciada e jornada aberta."
            : "Rota concluída.",
      );
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível alterar a rota.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="page planning-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">PLANEJAMENTO OPERACIONAL</p>
          <h1>Planejamento de rotas</h1>
          <p>
            Agrupe atividades, defina a sequência de paradas e atribua um
            motorista.
          </p>
        </div>
        <span className="live-pill">
          <i />
          {routes.length} rotas planejadas
        </span>
      </div>
      {error && (
        <div className="feedback error" role="alert">
          <span>{error}</span>
          <button onClick={() => setError(undefined)}>×</button>
        </div>
      )}
      {notice && (
        <div className="feedback success">
          <span>{notice}</span>
          <button onClick={() => setNotice(undefined)}>×</button>
        </div>
      )}
      <div className="planning-layout">
        <form className="panel route-builder" onSubmit={submit}>
          <header>
            <div>
              <p className="eyebrow">NOVA ROTA</p>
              <h2>Montar roteiro</h2>
            </div>
            <strong>{selected.length} paradas</strong>
          </header>
          <div className="route-fields">
            <label>
              Nome da rota
              <input
                name="name"
                required
                minLength={3}
                maxLength={160}
                placeholder="Rota Centro — manhã"
              />
            </label>
            <label>
              Data
              <input
                name="plannedDate"
                type="date"
                required
                defaultValue={new Date().toISOString().slice(0, 10)}
              />
            </label>
            <label>
              Motorista
              <select name="driverId" required defaultValue="">
                <option value="" disabled>
                  Selecione
                </option>
                {drivers.map((driver) => (
                  <option value={driver.id} key={driver.id}>
                    {driver.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="activity-pool">
            <div className="pool-heading">
              <b>Atividades disponíveis</b>
              <span>{available.length} aguardando atribuição</span>
            </div>
            {loading ? (
              <div className="empty loading-state">
                <i />
                Carregando...
              </div>
            ) : available.length === 0 ? (
              <div className="empty">Nenhuma atividade disponível.</div>
            ) : (
              available.map((activity) => {
                const position = selected.indexOf(activity.id);
                return (
                  <div
                    className={`planning-activity ${position >= 0 ? "selected" : ""}`}
                    key={activity.id}
                  >
                    <button
                      type="button"
                      className="select-stop"
                      onClick={() => toggle(activity.id)}
                    >
                      {position >= 0 ? position + 1 : "＋"}
                    </button>
                    <div>
                      <b>
                        {activity.externalReference ?? activity.id.slice(0, 8)}{" "}
                        · {activity.description}
                      </b>
                      <small>{activity.address}</small>
                    </div>
                    {position >= 0 && (
                      <div className="order-buttons">
                        <button
                          type="button"
                          onClick={() => move(activity.id, -1)}
                          disabled={position === 0}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => move(activity.id, 1)}
                          disabled={position === selected.length - 1}
                        >
                          ↓
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
          <footer>
            <span>
              A ordem numerada será enviada ao aplicativo do motorista.
            </span>
            <button
              className="button primary"
              disabled={saving || !selected.length}
            >
              {saving ? "Planejando..." : "Criar rota"}
            </button>
          </footer>
        </form>
        <section className="planned-routes">
          <div className="section-title">
            <div>
              <p className="eyebrow">PROGRAMAÇÃO</p>
              <h2>Rotas montadas</h2>
            </div>
            <button
              className="button secondary"
              onClick={() => void load()}
              disabled={loading}
            >
              ↻ Atualizar
            </button>
          </div>
          {routes.length === 0 && !loading ? (
            <div className="panel empty">As rotas criadas aparecerão aqui.</div>
          ) : (
            routes.map((route) => (
              <article className="panel route-card" key={route.id}>
                <header>
                  <div>
                    <b>{route.name}</b>
                    <span>
                      {new Date(route.plannedDate).toLocaleDateString("pt-BR", {
                        timeZone: "UTC",
                      })}{" "}
                      · {route.driver.name}
                    </span>
                  </div>
                  <div className="route-actions">
                    <em>
                      {route.status === "planned"
                        ? "Planejada"
                        : route.status === "published"
                          ? "Publicada"
                          : route.status === "in_progress"
                            ? "Em execução"
                            : "Concluída"}
                    </em>
                    {route.status !== "completed" && (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void transition(route)}
                      >
                        {route.status === "planned"
                          ? "Publicar"
                          : route.status === "published"
                            ? "Iniciar"
                            : "Concluir"}
                      </button>
                    )}
                  </div>
                </header>
                <ol>
                  {route.stops.map((stop) => (
                    <li key={stop.id}>
                      <span>{stop.sequence}</span>
                      <div>
                        <b>
                          {stop.activity.externalReference ??
                            stop.activity.id.slice(0, 8)}
                        </b>
                        <small>
                          {stop.activity.description} · {stop.activity.address}
                        </small>
                      </div>
                    </li>
                  ))}
                </ol>
              </article>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
