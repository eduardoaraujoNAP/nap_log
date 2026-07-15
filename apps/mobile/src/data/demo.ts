import type { Activity } from '../domain/activity';

export const demoActivities: Activity[] = [
  { id: '1', code: 'ENT-1042', customer: 'Mercado Santa Clara', address: 'Av. Paulista, 1578 · São Paulo', window: '08:30–10:00', kind: 'Entrega', status: 'accepted', notes: 'Receber na doca 2.' },
  { id: '2', code: 'COL-883', customer: 'Farmácia Nova Saúde', address: 'R. Augusta, 920 · São Paulo', window: '10:30–11:30', kind: 'Coleta', status: 'assigned' },
  { id: '3', code: 'ENT-1048', customer: 'Restaurante Horizonte', address: 'R. da Consolação, 234 · São Paulo', window: '13:00–15:00', kind: 'Entrega', status: 'assigned' },
];
