import test from 'node:test';
import assert from 'node:assert/strict';

import { RoomDurableObject } from '../worker/index.ts';

test('disconnect during game ends the match when mafia is eliminated', async () => {
  const state = {
    storage: {
      get: async () => undefined,
      put: async () => undefined,
      setAlarm: async () => undefined,
      deleteAlarm: async () => undefined,
    },
  };

  const room = new RoomDurableObject(state as any);
  (room as any).room = {
    id: 'room1',
    players: [
      { id: 'mafia-1', displayName: 'Mafia', room: 'room1', role: 'mafia', isAlive: true, isOwner: true, votes: {} },
      { id: 'civ-1', displayName: 'Citizen', room: 'room1', role: 'villager', isAlive: true, isOwner: false, votes: {} },
    ],
    gameState: 'night',
    phase: 'night',
    timer: 10,
    nightVotes: {},
    dayVotes: {},
    doctorSave: undefined,
    detectiveInvestigation: undefined,
    gameEvents: [],
    winner: undefined,
  };

  const socket = { readyState: 1, send() {} } as any;
  (room as any).sockets = new Map([[socket, 'mafia-1']]);

  await (room as any).leave(socket);

  assert.equal((room as any).room.players.length, 1);
  assert.equal((room as any).room.gameState, 'ended');
  assert.equal((room as any).room.winner, 'civilians');
});
