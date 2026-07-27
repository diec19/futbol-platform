import { z } from 'zod';
import {
  TOURNAMENT_STATUS,
  MATCH_STATUS,
  EVENT_TYPE,
  POSITION,
  BRACKET_STAGE,
  ROLE,
  PHASE_TYPE,
} from '@futbol/constants';

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const createTournamentSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  status: z.enum(TOURNAMENT_STATUS).default('DRAFT'),
  logoUrl: z.string().url().optional(),
  sponsor: z.string().max(100).optional(),
  rules: z.string().optional(),
});

export const updateTournamentSchema = createTournamentSchema.partial();

export const createCategorySchema = z.object({
  tournamentId: z.string().cuid(),
  name: z.string().min(2).max(80),
  minAge: z.number().int().min(0).optional(),
  maxAge: z.number().int().min(0).optional(),
  birthYear: z.number().int().min(1980).max(2030).optional(),
  maxPlayers: z.number().int().min(1).default(20),
  rules: z.string().optional(),
  phaseType: z.enum(PHASE_TYPE).default('MIXED'),
});

export const updateCategorySchema = createCategorySchema.partial().omit({ tournamentId: true });

export const createTeamSchema = z.object({
  categoryId: z.string().cuid(),
  name: z.string().min(2).max(100),
  shieldUrl: z.string().url().optional(),
  delegateName: z.string().max(100).optional(),
  contact: z.string().max(80).optional(),
  address: z.string().max(200).optional(),
});

export const updateTeamSchema = createTeamSchema.partial().omit({ categoryId: true });

export const createPlayerSchema = z.object({
  teamId: z.string().cuid().optional(),
  clubCategoryId: z.string().cuid().optional(),
  firstName: z.string().min(1).max(80).optional(),
  lastName: z.string().min(1).max(80).optional(),
  fullName: z.string().min(2).max(120),
  isClubPlayer: z.boolean().optional(),
  dni: z.string().min(6).max(20),
  birthDate: z.string().datetime(),
  photoUrl: z.string().optional(),
  shirtNumber: z.number().int().min(1).max(99).optional(),
  position: z.enum(POSITION).optional(),
  medicalStatus: z.string().max(200).optional(),
  observations: z.string().max(500).optional(),
});

export const updatePlayerSchema = createPlayerSchema.partial();

export const createRefereeSchema = z.object({
  fullName: z.string().min(2).max(120),
  contact: z.string().max(80).optional(),
  certifications: z.array(z.string()).default([]),
});

export const updateRefereeSchema = createRefereeSchema.partial();

export const scheduleMatchSchema = z.object({
  categoryId: z.string().cuid(),
  homeTeamId: z.string().cuid(),
  awayTeamId: z.string().cuid(),
  scheduledAt: z.string().datetime(),
  venue: z.string().max(120).optional(),
  refereeId: z.string().cuid().optional(),
  round: z.number().int().min(1).optional(),
  groupId: z.string().cuid().optional(),
  bracketStage: z.enum(BRACKET_STAGE).optional(),
  notes: z.string().optional(),
});

export const loadResultSchema = z.object({
  homeScore: z.number().int().min(0),
  awayScore: z.number().int().min(0),
  status: z.enum(['FINISHED', 'CANCELLED']).default('FINISHED'),
  notes: z.string().optional(),
  events: z.array(z.object({
    type: z.enum(EVENT_TYPE),
    playerId: z.string().cuid().optional(),
    teamId: z.string().cuid(),
    minute: z.number().int().min(0).max(200).optional(),
    notes: z.string().optional(),
  })).default([]),
});

export const generateFixtureSchema = z.object({
  groupId: z.string().cuid(),
  startDate: z.string().datetime(),
  venue: z.string().optional(),
  intervalDays: z.number().int().min(1).default(7),
});

export const initBracketSchema = z.object({
  categoryId: z.string().cuid(),
  stage: z.enum(BRACKET_STAGE),
  teamIds: z.array(z.string().cuid()).min(2),
  scheduledAt: z.string().datetime(),
});

export const createSanctionSchema = z.object({
  playerId: z.string().cuid(),
  reason: z.string().min(5).max(500),
  matchesBan: z.number().int().min(1),
  startDate: z.string().datetime(),
  notes: z.string().optional(),
});

export const loginSchema = z.object({
  login: z.string().min(1),
  password: z.string().min(1),
});

export const createUserSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(40).regex(/^[a-z0-9_]+$/),
  password: z.string().min(8),
  fullName: z.string().min(2).max(100),
  role: z.enum(ROLE).default('OPERATOR'),
});

// ── Sponsors ────────────────────────────────────────────────────────────────

export const createSponsorSchema = z.object({
  name: z.string().min(2).max(120),
  contactName: z.string().max(100).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email().optional(),
  logoUrl: z.string().url().optional(),
  website: z.string().url().optional(),
  slideUrl: z.string().url().optional(),
  slideOrder: z.number().int().min(0).optional(),
});

export const updateSponsorSchema = createSponsorSchema.partial();

export const createSponsorPlanSchema = z.object({
  name: z.string().min(2).max(80),
  monthlyAmount: z.number().positive(),
  durationMonths: z.number().int().min(1).max(24).default(6),
  description: z.string().max(300).optional(),
});

export const updateSponsorPlanSchema = createSponsorPlanSchema.partial();

export const createSponsorshipSchema = z.object({
  sponsorId: z.string().cuid(),
  planId: z.string().cuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

// ── Benefits ─────────────────────────────────────────────────────────────────

export const createBenefitSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url().optional(),
  type: z.enum(['EXTERNAL', 'INTERNAL']).default('EXTERNAL'),
  sponsorId: z.string().cuid().optional(),
});

export const updateBenefitSchema = createBenefitSchema.partial();
