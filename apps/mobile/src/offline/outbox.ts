import type { LocalStore, OutboxCommand } from './contracts';
import { createUuid } from '../utils/id';

export class Outbox {
  constructor(private readonly store: LocalStore) {}

  async add<T>(type: string, aggregateId: string, payload: T): Promise<OutboxCommand<T>> {
    const command: OutboxCommand<T> = {
      id: createUuid(),
      type,
      aggregateId,
      occurredAt: new Date().toISOString(),
      sequence: Date.now(),
      payload,
      attempts: 0,
    };
    await this.store.enqueue(command);
    return command;
  }
}
