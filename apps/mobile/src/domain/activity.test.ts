import { describe, expect, it } from 'vitest';
import { canTransition, transitionActivity, type Activity } from './activity';
const activity: Activity = { id: '1', code: 'A', customer: 'C', address: 'X', window: '8h', kind: 'Entrega', status: 'assigned' };
describe('activity state machine', () => {
  it('allows the canonical next state', () => expect(canTransition('assigned', 'accepted')).toBe(true));
  it('rejects state skipping', () => expect(() => transitionActivity(activity, 'completed')).toThrow('Transição inválida'));
});
