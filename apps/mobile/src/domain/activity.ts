export type ActivityStatus =
  | 'assigned'
  | 'accepted'
  | 'en_route'
  | 'on_site'
  | 'in_service'
  | 'completed'
  | 'failed';

export interface Activity {
  id: string;
  code: string;
  customer: string;
  address: string;
  window: string;
  kind: 'Entrega' | 'Coleta';
  status: ActivityStatus;
  notes?: string;
}

const transitions: Record<ActivityStatus, readonly ActivityStatus[]> = {
  assigned: ['accepted', 'failed'],
  accepted: ['en_route', 'failed'],
  en_route: ['on_site', 'failed'],
  on_site: ['in_service', 'failed'],
  in_service: ['completed', 'failed'],
  completed: [],
  failed: [],
};

export function canTransition(from: ActivityStatus, to: ActivityStatus): boolean {
  return transitions[from].includes(to);
}

export function transitionActivity(activity: Activity, to: ActivityStatus): Activity {
  if (!canTransition(activity.status, to)) {
    throw new Error(`Transição inválida: ${activity.status} -> ${to}`);
  }
  return { ...activity, status: to };
}

export const statusLabel: Record<ActivityStatus, string> = {
  assigned: 'Atribuída', accepted: 'Aceita', en_route: 'Em rota', on_site: 'No local',
  in_service: 'Em atendimento', completed: 'Concluída', failed: 'Insucesso',
};
