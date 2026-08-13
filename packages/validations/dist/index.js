"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUnlinkRequestSchema = exports.createJoinRequestSchema = exports.linkPlayerSchema = exports.registerMemberSchema = exports.updateBenefitSchema = exports.createBenefitSchema = exports.createSponsorshipSchema = exports.updateSponsorPlanSchema = exports.createSponsorPlanSchema = exports.updateSponsorSchema = exports.createSponsorSchema = exports.createUserSchema = exports.loginSchema = exports.createSanctionSchema = exports.initBracketSchema = exports.generateFixtureSchema = exports.loadResultSchema = exports.scheduleMatchSchema = exports.updateRefereeSchema = exports.createRefereeSchema = exports.updatePlayerSchema = exports.createPlayerSchema = exports.updateTeamSchema = exports.createTeamSchema = exports.updateCategorySchema = exports.createCategorySchema = exports.updateTournamentSchema = exports.createTournamentSchema = exports.paginationSchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("@futbol/constants");
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().min(1).default(1),
    limit: zod_1.z.coerce.number().min(1).max(100).default(20),
});
exports.createTournamentSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(120),
    description: zod_1.z.string().max(500).optional(),
    startDate: zod_1.z.string().datetime(),
    endDate: zod_1.z.string().datetime(),
    status: zod_1.z.enum(constants_1.TOURNAMENT_STATUS).default('DRAFT'),
    logoUrl: zod_1.z.string().url().optional(),
    sponsor: zod_1.z.string().max(100).optional(),
    rules: zod_1.z.string().optional(),
});
exports.updateTournamentSchema = exports.createTournamentSchema.partial();
exports.createCategorySchema = zod_1.z.object({
    tournamentId: zod_1.z.string().cuid(),
    name: zod_1.z.string().min(2).max(80),
    minAge: zod_1.z.number().int().min(0).optional(),
    maxAge: zod_1.z.number().int().min(0).optional(),
    birthYear: zod_1.z.number().int().min(1980).max(2030).optional(),
    maxPlayers: zod_1.z.number().int().min(1).default(20),
    rules: zod_1.z.string().optional(),
    phaseType: zod_1.z.enum(constants_1.PHASE_TYPE).default('MIXED'),
});
exports.updateCategorySchema = exports.createCategorySchema.partial().omit({ tournamentId: true });
exports.createTeamSchema = zod_1.z.object({
    categoryId: zod_1.z.string().cuid(),
    name: zod_1.z.string().min(2).max(100),
    shieldUrl: zod_1.z.string().url().optional(),
    delegateName: zod_1.z.string().max(100).optional(),
    contact: zod_1.z.string().max(80).optional(),
    address: zod_1.z.string().max(200).optional(),
});
exports.updateTeamSchema = exports.createTeamSchema.partial().omit({ categoryId: true });
exports.createPlayerSchema = zod_1.z.object({
    teamId: zod_1.z.string().cuid().optional(),
    clubCategoryId: zod_1.z.string().cuid().optional(),
    firstName: zod_1.z.string().min(1).max(80).optional(),
    lastName: zod_1.z.string().min(1).max(80).optional(),
    fullName: zod_1.z.string().min(2).max(120),
    isClubPlayer: zod_1.z.boolean().optional(),
    dni: zod_1.z.string().min(6).max(20),
    birthDate: zod_1.z.string().datetime(),
    photoUrl: zod_1.z.string().optional(),
    shirtNumber: zod_1.z.number().int().min(1).max(99).optional(),
    position: zod_1.z.enum(constants_1.POSITION).optional(),
    medicalStatus: zod_1.z.string().max(200).optional(),
    observations: zod_1.z.string().max(500).optional(),
});
exports.updatePlayerSchema = exports.createPlayerSchema.partial();
exports.createRefereeSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(2).max(120),
    contact: zod_1.z.string().max(80).optional(),
    certifications: zod_1.z.array(zod_1.z.string()).default([]),
});
exports.updateRefereeSchema = exports.createRefereeSchema.partial();
exports.scheduleMatchSchema = zod_1.z.object({
    categoryId: zod_1.z.string().cuid(),
    homeTeamId: zod_1.z.string().cuid(),
    awayTeamId: zod_1.z.string().cuid(),
    scheduledAt: zod_1.z.string().datetime(),
    venue: zod_1.z.string().max(120).optional(),
    refereeId: zod_1.z.string().cuid().optional(),
    round: zod_1.z.number().int().min(1).optional(),
    groupId: zod_1.z.string().cuid().optional(),
    bracketStage: zod_1.z.enum(constants_1.BRACKET_STAGE).optional(),
    notes: zod_1.z.string().optional(),
});
exports.loadResultSchema = zod_1.z.object({
    homeScore: zod_1.z.number().int().min(0),
    awayScore: zod_1.z.number().int().min(0),
    status: zod_1.z.enum(['FINISHED', 'CANCELLED']).default('FINISHED'),
    notes: zod_1.z.string().optional(),
    events: zod_1.z.array(zod_1.z.object({
        type: zod_1.z.enum(constants_1.EVENT_TYPE),
        playerId: zod_1.z.string().cuid().optional(),
        teamId: zod_1.z.string().cuid(),
        minute: zod_1.z.number().int().min(0).max(200).optional(),
        notes: zod_1.z.string().optional(),
    })).default([]),
});
exports.generateFixtureSchema = zod_1.z.object({
    groupId: zod_1.z.string().cuid(),
    startDate: zod_1.z.string().datetime(),
    venue: zod_1.z.string().optional(),
    intervalDays: zod_1.z.number().int().min(1).default(7),
});
exports.initBracketSchema = zod_1.z.object({
    categoryId: zod_1.z.string().cuid(),
    stage: zod_1.z.enum(constants_1.BRACKET_STAGE),
    teamIds: zod_1.z.array(zod_1.z.string().cuid()).min(2),
    scheduledAt: zod_1.z.string().datetime(),
});
exports.createSanctionSchema = zod_1.z.object({
    playerId: zod_1.z.string().cuid(),
    reason: zod_1.z.string().min(5).max(500),
    matchesBan: zod_1.z.number().int().min(1),
    startDate: zod_1.z.string().datetime(),
    notes: zod_1.z.string().optional(),
});
exports.loginSchema = zod_1.z.object({
    login: zod_1.z.string().min(1),
    password: zod_1.z.string().min(1),
});
exports.createUserSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    username: zod_1.z.string().min(3).max(40).regex(/^[a-z0-9_]+$/),
    password: zod_1.z.string().min(8),
    fullName: zod_1.z.string().min(2).max(100),
    role: zod_1.z.enum(constants_1.ROLE).default('OPERATOR'),
});
// ── Sponsors ────────────────────────────────────────────────────────────────
exports.createSponsorSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(120),
    contactName: zod_1.z.string().max(100).optional(),
    phone: zod_1.z.string().max(30).optional(),
    email: zod_1.z.string().email().optional(),
    logoUrl: zod_1.z.string().optional(),
    website: zod_1.z.string().url().optional(),
    // Acepta URL o imagen base64 (data:image/...) cargada desde el admin
    slideUrl: zod_1.z.string().optional(),
    slideOrder: zod_1.z.number().int().min(0).optional(),
});
exports.updateSponsorSchema = exports.createSponsorSchema.partial();
exports.createSponsorPlanSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(80),
    monthlyAmount: zod_1.z.number().positive(),
    durationMonths: zod_1.z.number().int().min(1).max(24).default(6),
    description: zod_1.z.string().max(300).optional(),
});
exports.updateSponsorPlanSchema = exports.createSponsorPlanSchema.partial();
exports.createSponsorshipSchema = zod_1.z.object({
    sponsorId: zod_1.z.string().cuid(),
    planId: zod_1.z.string().cuid(),
    startDate: zod_1.z.string().datetime(),
    endDate: zod_1.z.string().datetime(),
});
// ── Benefits ─────────────────────────────────────────────────────────────────
exports.createBenefitSchema = zod_1.z.object({
    title: zod_1.z.string().min(2).max(120),
    description: zod_1.z.string().max(500).optional(),
    imageUrl: zod_1.z.string().url().optional(),
    type: zod_1.z.enum(['EXTERNAL', 'INTERNAL']).default('EXTERNAL'),
    sponsorId: zod_1.z.string().cuid().optional(),
});
exports.updateBenefitSchema = exports.createBenefitSchema.partial();
// ── Members (socios) ──────────────────────────────────────────────────────────
exports.registerMemberSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(2).max(120),
    dni: zod_1.z.string().min(6).max(20),
    email: zod_1.z.string().email(),
    phone: zod_1.z.string().max(30).optional(),
    address: zod_1.z.string().max(200).optional(),
    username: zod_1.z.string().min(3).max(30).optional(),
    password: zod_1.z.string().min(6).max(100),
});
exports.linkPlayerSchema = zod_1.z.object({
    dni: zod_1.z.string().min(6).max(20),
    birthDate: zod_1.z.string().datetime(),
});
exports.createJoinRequestSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(2).max(120),
    dni: zod_1.z.string().min(6).max(20),
    birthDate: zod_1.z.string().datetime(),
    categoryId: zod_1.z.string().cuid().optional(),
});
exports.createUnlinkRequestSchema = zod_1.z.object({
    playerId: zod_1.z.string().cuid(),
    reason: zod_1.z.string().max(300).optional(),
});
//# sourceMappingURL=index.js.map