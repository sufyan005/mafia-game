import { z } from "zod";

// Player schema
export const playerSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  room: z.string(),
  role: z.enum(['mafia', 'doctor', 'detective', 'villager']).optional(),
  isAlive: z.boolean().default(true),
  isOwner: z.boolean().default(false),
  votes: z.record(z.string()).default({}),
});

export type Player = z.infer<typeof playerSchema>;

// Role configuration schema
export const roleConfigSchema = z.object({
  mafiaCount: z.number().min(1).max(10),
  doctorCount: z.number().min(0).max(5),
  detectiveCount: z.number().min(0).max(5),
});

// Room schema
export const roomSchema = z.object({
  id: z.string(),
  players: z.array(playerSchema),
  gameState: z.enum(['waiting', 'night', 'day', 'break', 'ended']).default('waiting'),
  phase: z.enum(['night', 'day', 'break']).optional(),
  timer: z.number().default(0),
  nightVotes: z.record(z.string()).default({}),
  dayVotes: z.record(z.string()).default({}),
  doctorSave: z.string().optional(),
  detectiveInvestigation: z.string().optional(),
  gameEvents: z.array(z.object({
    type: z.string(),
    message: z.string(),
    timestamp: z.number(),
  })).default([]),
  winner: z.string().optional(),
  roleConfig: roleConfigSchema.optional(),
});

export type Room = z.infer<typeof roomSchema>;

// Chat message schema
export const chatMessageSchema = z.object({
  id: z.string(),
  sender: z.string(),
  senderName: z.string(),
  message: z.string(),
  type: z.enum(['public', 'mafia']),
  timestamp: z.number(),
  room: z.string(),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

// Socket event schemas
export const joinRoomSchema = z.object({
  room: z.enum(['room1', 'room2']),
  displayName: z.string().min(1).max(20),
});

export const voteSchema = z.object({
  target: z.string(),
  phase: z.enum(['night', 'day']),
});

export const chatMessageInputSchema = z.object({
  message: z.string().min(1).max(500),
  type: z.enum(['public', 'mafia']),
});

export const doctorSaveSchema = z.object({
  target: z.string(),
});

export const detectiveInvestigateSchema = z.object({
  target: z.string(),
});

export const startGameSchema = z.object({
  mafiaCount: z.number().min(1).max(10),
  doctorCount: z.number().min(0).max(5),
  detectiveCount: z.number().min(0).max(5),
});

export type JoinRoomData = z.infer<typeof joinRoomSchema>;
export type VoteData = z.infer<typeof voteSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageInputSchema>;
export type DoctorSaveData = z.infer<typeof doctorSaveSchema>;
export type DetectiveInvestigateData = z.infer<typeof detectiveInvestigateSchema>;
export type StartGameData = z.infer<typeof startGameSchema>;
export type RoleConfig = z.infer<typeof roleConfigSchema>;
