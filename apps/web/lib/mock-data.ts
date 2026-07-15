import type { Activity, DashboardMetric, DriverPosition } from "./types";

export const metrics: DashboardMetric[] = [
  { label: "Atividades hoje", value: "248", detail: "212 planejadas", trend: "+12%", tone: "blue" },
  { label: "Concluídas", value: "186", detail: "75% da operação", trend: "+8%", tone: "green" },
  { label: "Em andamento", value: "42", detail: "18 motoristas ativos", tone: "purple" },
  { label: "Precisam de atenção", value: "20", detail: "6 atrasos críticos", trend: "−3%", tone: "orange" },
];

export const activities: Activity[] = [
  { id: "1", reference: "ENT-10482", customer: "Mercado Santa Clara", address: "Av. Paulista, 1040", driver: "Carlos Mendes", status: "Em rota", scheduledAt: "09:30", kind: "Entrega" },
  { id: "2", reference: "COL-10479", customer: "Farmácia Horizonte", address: "R. Augusta, 2215", driver: "Aline Rocha", status: "No local", scheduledAt: "09:45", kind: "Coleta" },
  { id: "3", reference: "ENT-10477", customer: "Restaurante Manacá", address: "R. Oscar Freire, 680", driver: "Rafael Lima", status: "Atenção", scheduledAt: "09:10", kind: "Entrega" },
  { id: "4", reference: "ENT-10491", customer: "Livraria Central", address: "R. Vergueiro, 1450", driver: "Não atribuído", status: "Pendente", scheduledAt: "10:30", kind: "Entrega" },
  { id: "5", reference: "COL-10472", customer: "Clínica Bem Viver", address: "Al. Santos, 1165", driver: "Marina Costa", status: "Concluída", scheduledAt: "08:40", kind: "Coleta" },
  { id: "6", reference: "ENT-10495", customer: "Empório do Bairro", address: "R. Cardoso de Almeida, 90", driver: "Diego Alves", status: "Em rota", scheduledAt: "11:15", kind: "Entrega" },
];

export const drivers: DriverPosition[] = [
  { id: "d1", name: "Carlos Mendes", initials: "CM", vehicle: "Fiorino · ABC-1D23", status: "Em rota", lastUpdate: "Agora", x: 33, y: 37 },
  { id: "d2", name: "Aline Rocha", initials: "AR", vehicle: "Sprinter · EFG-4H56", status: "Parado", lastUpdate: "há 2 min", x: 62, y: 29 },
  { id: "d3", name: "Rafael Lima", initials: "RL", vehicle: "Fiorino · IJK-7L89", status: "Em rota", lastUpdate: "há 1 min", x: 53, y: 64 },
  { id: "d4", name: "Marina Costa", initials: "MC", vehicle: "Partner · MNO-0P12", status: "Disponível", lastUpdate: "há 4 min", x: 72, y: 71 },
];
