import { Activity } from './activity.types';

export const ACTIVITY_REPOSITORY = Symbol('ACTIVITY_REPOSITORY');

export interface ActivityRepository {
  create(activity: Activity): Promise<Activity>;
  findAll(tenantId: string): Promise<Activity[]>;
  findById(tenantId: string, id: string): Promise<Activity | undefined>;
  save(activity: Activity): Promise<Activity>;
}

export class InMemoryActivityRepository implements ActivityRepository {
  private readonly rows = new Map<string, Activity>();

  async create(activity: Activity): Promise<Activity> {
    this.rows.set(activity.id, structuredClone(activity));
    return structuredClone(activity);
  }

  async findAll(tenantId: string): Promise<Activity[]> {
    return [...this.rows.values()]
      .filter((row) => row.tenantId === tenantId)
      .map((row) => structuredClone(row));
  }

  async findById(tenantId: string, id: string): Promise<Activity | undefined> {
    const row = this.rows.get(id);
    return row?.tenantId === tenantId ? structuredClone(row) : undefined;
  }

  async save(activity: Activity): Promise<Activity> {
    this.rows.set(activity.id, structuredClone(activity));
    return structuredClone(activity);
  }
}
