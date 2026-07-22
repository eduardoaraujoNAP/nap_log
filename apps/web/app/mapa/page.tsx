"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { trackingApi } from "@/lib/api";
import type { LatestPosition } from "@/lib/types";

export default function MapPage() {
  const [positions, setPositions] = useState<LatestPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const load = useCallback(async () => {
    try { setPositions(await trackingApi.positions()); setError(undefined); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Falha ao carregar posições."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 30_000);
    return () => window.clearInterval(timer);
  }, [load]);
  const bounds = useMemo(() => {
    const latitudes=positions.map(item=>item.latitude),longitudes=positions.map(item=>item.longitude);
    return {minLat:Math.min(...latitudes),maxLat:Math.max(...latitudes),minLng:Math.min(...longitudes),maxLng:Math.max(...longitudes)};
  }, [positions]);
  const pinStyle = (position:LatestPosition) => ({
    left:`${10+((position.longitude-bounds.minLng)/(bounds.maxLng-bounds.minLng||1))*80}%`,
    top:`${90-((position.latitude-bounds.minLat)/(bounds.maxLat-bounds.minLat||1))*80}%`,
  });
  return <div className="page map-page">
    <div className="page-heading"><div><p className="eyebrow">ACOMPANHAMENTO OPERACIONAL</p><h1>Posições da operação</h1><p>Última posição recebida de cada jornada ativa.</p></div><button className="button secondary" onClick={() => void load()} disabled={loading}>↻ Atualizar</button></div>
    {error && <div className="feedback error" role="alert"><span>{error}</span></div>}
    <section className="map-layout"><aside className="map-list"><div className="map-list-head"><h2>Motoristas em jornada</h2><span>{positions.filter(position => position.status === "online").length} online · {positions.filter(position => position.status === "stale").length} sem sinal</span></div>
      {loading && <div className="empty loading-state"><i/>Carregando...</div>}
      {positions.map(position => <div className={`map-driver ${position.status}`} key={position.driverId}><span className="avatar">{position.driverName.split(" ").map(part=>part[0]).join("").slice(0,2).toUpperCase()}<i className={position.status}/></span><div><b>{position.driverName}</b><small>{position.latitude.toFixed(5)}, {position.longitude.toFixed(5)}</small><span>{position.status === "online" ? "Online" : "Sem atualização"} · {new Date(position.recordedAt).toLocaleString("pt-BR")} · ±{Math.round(position.accuracy)} m</span></div></div>)}
      {!loading && positions.length===0 && <div className="empty">Nenhuma jornada enviou GPS.</div>}
    </aside>
      <div className={`map-canvas ${positions.length?"":"real-map-empty"}`}>
        {positions.length ? <><div className="map-grid"/>{positions.map(position=><div className={`map-pin ${position.status}`} key={position.driverId} style={pinStyle(position)} title={`${position.latitude}, ${position.longitude}`}><span>{position.driverName.slice(0,2).toUpperCase()}</span><small>{position.driverName}</small></div>)}<div className="map-notice"><b>Posições GPS reais</b><span>O painel sinaliza motoristas há mais de dois minutos sem uma nova posição.</span></div></> : <div><strong>Nenhuma posição GPS disponível</strong><p>O mapa será preenchido quando uma jornada ativa enviar coordenadas reais.</p></div>}
      </div>
    </section>
  </div>;
}
