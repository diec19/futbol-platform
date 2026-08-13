import { z } from 'zod';
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
}, {
    page?: number | undefined;
    limit?: number | undefined;
}>;
export declare const createTournamentSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    startDate: z.ZodString;
    endDate: z.ZodString;
    status: z.ZodDefault<z.ZodEnum<["DRAFT", "ACTIVE", "SUSPENDED", "FINISHED"]>>;
    logoUrl: z.ZodOptional<z.ZodString>;
    sponsor: z.ZodOptional<z.ZodString>;
    rules: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "DRAFT" | "ACTIVE" | "SUSPENDED" | "FINISHED";
    name: string;
    startDate: string;
    endDate: string;
    description?: string | undefined;
    logoUrl?: string | undefined;
    sponsor?: string | undefined;
    rules?: string | undefined;
}, {
    name: string;
    startDate: string;
    endDate: string;
    status?: "DRAFT" | "ACTIVE" | "SUSPENDED" | "FINISHED" | undefined;
    description?: string | undefined;
    logoUrl?: string | undefined;
    sponsor?: string | undefined;
    rules?: string | undefined;
}>;
export declare const updateTournamentSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<["DRAFT", "ACTIVE", "SUSPENDED", "FINISHED"]>>>;
    logoUrl: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    sponsor: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    rules: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    status?: "DRAFT" | "ACTIVE" | "SUSPENDED" | "FINISHED" | undefined;
    name?: string | undefined;
    description?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    logoUrl?: string | undefined;
    sponsor?: string | undefined;
    rules?: string | undefined;
}, {
    status?: "DRAFT" | "ACTIVE" | "SUSPENDED" | "FINISHED" | undefined;
    name?: string | undefined;
    description?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    logoUrl?: string | undefined;
    sponsor?: string | undefined;
    rules?: string | undefined;
}>;
export declare const createCategorySchema: z.ZodObject<{
    tournamentId: z.ZodString;
    name: z.ZodString;
    minAge: z.ZodOptional<z.ZodNumber>;
    maxAge: z.ZodOptional<z.ZodNumber>;
    birthYear: z.ZodOptional<z.ZodNumber>;
    maxPlayers: z.ZodDefault<z.ZodNumber>;
    rules: z.ZodOptional<z.ZodString>;
    phaseType: z.ZodDefault<z.ZodEnum<["GROUP", "KNOCKOUT", "MIXED"]>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    tournamentId: string;
    maxPlayers: number;
    phaseType: "GROUP" | "KNOCKOUT" | "MIXED";
    rules?: string | undefined;
    minAge?: number | undefined;
    maxAge?: number | undefined;
    birthYear?: number | undefined;
}, {
    name: string;
    tournamentId: string;
    rules?: string | undefined;
    minAge?: number | undefined;
    maxAge?: number | undefined;
    birthYear?: number | undefined;
    maxPlayers?: number | undefined;
    phaseType?: "GROUP" | "KNOCKOUT" | "MIXED" | undefined;
}>;
export declare const updateCategorySchema: z.ZodObject<Omit<{
    tournamentId: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    minAge: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    maxAge: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    birthYear: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    maxPlayers: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    rules: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    phaseType: z.ZodOptional<z.ZodDefault<z.ZodEnum<["GROUP", "KNOCKOUT", "MIXED"]>>>;
}, "tournamentId">, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    rules?: string | undefined;
    minAge?: number | undefined;
    maxAge?: number | undefined;
    birthYear?: number | undefined;
    maxPlayers?: number | undefined;
    phaseType?: "GROUP" | "KNOCKOUT" | "MIXED" | undefined;
}, {
    name?: string | undefined;
    rules?: string | undefined;
    minAge?: number | undefined;
    maxAge?: number | undefined;
    birthYear?: number | undefined;
    maxPlayers?: number | undefined;
    phaseType?: "GROUP" | "KNOCKOUT" | "MIXED" | undefined;
}>;
export declare const createTeamSchema: z.ZodObject<{
    categoryId: z.ZodString;
    name: z.ZodString;
    shieldUrl: z.ZodOptional<z.ZodString>;
    delegateName: z.ZodOptional<z.ZodString>;
    contact: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    categoryId: string;
    shieldUrl?: string | undefined;
    delegateName?: string | undefined;
    contact?: string | undefined;
    address?: string | undefined;
}, {
    name: string;
    categoryId: string;
    shieldUrl?: string | undefined;
    delegateName?: string | undefined;
    contact?: string | undefined;
    address?: string | undefined;
}>;
export declare const updateTeamSchema: z.ZodObject<Omit<{
    categoryId: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    shieldUrl: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    delegateName: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    contact: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    address: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "categoryId">, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    shieldUrl?: string | undefined;
    delegateName?: string | undefined;
    contact?: string | undefined;
    address?: string | undefined;
}, {
    name?: string | undefined;
    shieldUrl?: string | undefined;
    delegateName?: string | undefined;
    contact?: string | undefined;
    address?: string | undefined;
}>;
export declare const createPlayerSchema: z.ZodObject<{
    teamId: z.ZodOptional<z.ZodString>;
    clubCategoryId: z.ZodOptional<z.ZodString>;
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    fullName: z.ZodString;
    isClubPlayer: z.ZodOptional<z.ZodBoolean>;
    dni: z.ZodString;
    birthDate: z.ZodString;
    photoUrl: z.ZodOptional<z.ZodString>;
    shirtNumber: z.ZodOptional<z.ZodNumber>;
    position: z.ZodOptional<z.ZodEnum<["GOALKEEPER", "DEFENDER", "MIDFIELDER", "FORWARD"]>>;
    medicalStatus: z.ZodOptional<z.ZodString>;
    observations: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    fullName: string;
    dni: string;
    birthDate: string;
    teamId?: string | undefined;
    clubCategoryId?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    isClubPlayer?: boolean | undefined;
    photoUrl?: string | undefined;
    shirtNumber?: number | undefined;
    position?: "GOALKEEPER" | "DEFENDER" | "MIDFIELDER" | "FORWARD" | undefined;
    medicalStatus?: string | undefined;
    observations?: string | undefined;
}, {
    fullName: string;
    dni: string;
    birthDate: string;
    teamId?: string | undefined;
    clubCategoryId?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    isClubPlayer?: boolean | undefined;
    photoUrl?: string | undefined;
    shirtNumber?: number | undefined;
    position?: "GOALKEEPER" | "DEFENDER" | "MIDFIELDER" | "FORWARD" | undefined;
    medicalStatus?: string | undefined;
    observations?: string | undefined;
}>;
export declare const updatePlayerSchema: z.ZodObject<{
    teamId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    clubCategoryId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    firstName: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    lastName: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    fullName: z.ZodOptional<z.ZodString>;
    isClubPlayer: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
    dni: z.ZodOptional<z.ZodString>;
    birthDate: z.ZodOptional<z.ZodString>;
    photoUrl: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    shirtNumber: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    position: z.ZodOptional<z.ZodOptional<z.ZodEnum<["GOALKEEPER", "DEFENDER", "MIDFIELDER", "FORWARD"]>>>;
    medicalStatus: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    observations: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    teamId?: string | undefined;
    clubCategoryId?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    fullName?: string | undefined;
    isClubPlayer?: boolean | undefined;
    dni?: string | undefined;
    birthDate?: string | undefined;
    photoUrl?: string | undefined;
    shirtNumber?: number | undefined;
    position?: "GOALKEEPER" | "DEFENDER" | "MIDFIELDER" | "FORWARD" | undefined;
    medicalStatus?: string | undefined;
    observations?: string | undefined;
}, {
    teamId?: string | undefined;
    clubCategoryId?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    fullName?: string | undefined;
    isClubPlayer?: boolean | undefined;
    dni?: string | undefined;
    birthDate?: string | undefined;
    photoUrl?: string | undefined;
    shirtNumber?: number | undefined;
    position?: "GOALKEEPER" | "DEFENDER" | "MIDFIELDER" | "FORWARD" | undefined;
    medicalStatus?: string | undefined;
    observations?: string | undefined;
}>;
export declare const createRefereeSchema: z.ZodObject<{
    fullName: z.ZodString;
    contact: z.ZodOptional<z.ZodString>;
    certifications: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    fullName: string;
    certifications: string[];
    contact?: string | undefined;
}, {
    fullName: string;
    contact?: string | undefined;
    certifications?: string[] | undefined;
}>;
export declare const updateRefereeSchema: z.ZodObject<{
    fullName: z.ZodOptional<z.ZodString>;
    contact: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    certifications: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
}, "strip", z.ZodTypeAny, {
    contact?: string | undefined;
    fullName?: string | undefined;
    certifications?: string[] | undefined;
}, {
    contact?: string | undefined;
    fullName?: string | undefined;
    certifications?: string[] | undefined;
}>;
export declare const scheduleMatchSchema: z.ZodObject<{
    categoryId: z.ZodString;
    homeTeamId: z.ZodString;
    awayTeamId: z.ZodString;
    scheduledAt: z.ZodString;
    venue: z.ZodOptional<z.ZodString>;
    refereeId: z.ZodOptional<z.ZodString>;
    round: z.ZodOptional<z.ZodNumber>;
    groupId: z.ZodOptional<z.ZodString>;
    bracketStage: z.ZodOptional<z.ZodEnum<["ROUND_OF_16", "QUARTER_FINAL", "SEMI_FINAL", "THIRD_PLACE", "FINAL"]>>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    categoryId: string;
    homeTeamId: string;
    awayTeamId: string;
    scheduledAt: string;
    venue?: string | undefined;
    refereeId?: string | undefined;
    round?: number | undefined;
    groupId?: string | undefined;
    bracketStage?: "ROUND_OF_16" | "QUARTER_FINAL" | "SEMI_FINAL" | "THIRD_PLACE" | "FINAL" | undefined;
    notes?: string | undefined;
}, {
    categoryId: string;
    homeTeamId: string;
    awayTeamId: string;
    scheduledAt: string;
    venue?: string | undefined;
    refereeId?: string | undefined;
    round?: number | undefined;
    groupId?: string | undefined;
    bracketStage?: "ROUND_OF_16" | "QUARTER_FINAL" | "SEMI_FINAL" | "THIRD_PLACE" | "FINAL" | undefined;
    notes?: string | undefined;
}>;
export declare const loadResultSchema: z.ZodObject<{
    homeScore: z.ZodNumber;
    awayScore: z.ZodNumber;
    status: z.ZodDefault<z.ZodEnum<["FINISHED", "CANCELLED"]>>;
    notes: z.ZodOptional<z.ZodString>;
    events: z.ZodDefault<z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["GOAL", "OWN_GOAL", "YELLOW_CARD", "RED_CARD", "DOUBLE_YELLOW", "MVP", "SUBSTITUTION"]>;
        playerId: z.ZodOptional<z.ZodString>;
        teamId: z.ZodString;
        minute: z.ZodOptional<z.ZodNumber>;
        notes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "GOAL" | "OWN_GOAL" | "YELLOW_CARD" | "RED_CARD" | "DOUBLE_YELLOW" | "MVP" | "SUBSTITUTION";
        teamId: string;
        notes?: string | undefined;
        playerId?: string | undefined;
        minute?: number | undefined;
    }, {
        type: "GOAL" | "OWN_GOAL" | "YELLOW_CARD" | "RED_CARD" | "DOUBLE_YELLOW" | "MVP" | "SUBSTITUTION";
        teamId: string;
        notes?: string | undefined;
        playerId?: string | undefined;
        minute?: number | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    status: "FINISHED" | "CANCELLED";
    homeScore: number;
    awayScore: number;
    events: {
        type: "GOAL" | "OWN_GOAL" | "YELLOW_CARD" | "RED_CARD" | "DOUBLE_YELLOW" | "MVP" | "SUBSTITUTION";
        teamId: string;
        notes?: string | undefined;
        playerId?: string | undefined;
        minute?: number | undefined;
    }[];
    notes?: string | undefined;
}, {
    homeScore: number;
    awayScore: number;
    status?: "FINISHED" | "CANCELLED" | undefined;
    notes?: string | undefined;
    events?: {
        type: "GOAL" | "OWN_GOAL" | "YELLOW_CARD" | "RED_CARD" | "DOUBLE_YELLOW" | "MVP" | "SUBSTITUTION";
        teamId: string;
        notes?: string | undefined;
        playerId?: string | undefined;
        minute?: number | undefined;
    }[] | undefined;
}>;
export declare const generateFixtureSchema: z.ZodObject<{
    groupId: z.ZodString;
    startDate: z.ZodString;
    venue: z.ZodOptional<z.ZodString>;
    intervalDays: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    startDate: string;
    groupId: string;
    intervalDays: number;
    venue?: string | undefined;
}, {
    startDate: string;
    groupId: string;
    venue?: string | undefined;
    intervalDays?: number | undefined;
}>;
export declare const initBracketSchema: z.ZodObject<{
    categoryId: z.ZodString;
    stage: z.ZodEnum<["ROUND_OF_16", "QUARTER_FINAL", "SEMI_FINAL", "THIRD_PLACE", "FINAL"]>;
    teamIds: z.ZodArray<z.ZodString, "many">;
    scheduledAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    categoryId: string;
    scheduledAt: string;
    stage: "ROUND_OF_16" | "QUARTER_FINAL" | "SEMI_FINAL" | "THIRD_PLACE" | "FINAL";
    teamIds: string[];
}, {
    categoryId: string;
    scheduledAt: string;
    stage: "ROUND_OF_16" | "QUARTER_FINAL" | "SEMI_FINAL" | "THIRD_PLACE" | "FINAL";
    teamIds: string[];
}>;
export declare const createSanctionSchema: z.ZodObject<{
    playerId: z.ZodString;
    reason: z.ZodString;
    matchesBan: z.ZodNumber;
    startDate: z.ZodString;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    startDate: string;
    playerId: string;
    reason: string;
    matchesBan: number;
    notes?: string | undefined;
}, {
    startDate: string;
    playerId: string;
    reason: string;
    matchesBan: number;
    notes?: string | undefined;
}>;
export declare const loginSchema: z.ZodObject<{
    login: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    login: string;
    password: string;
}, {
    login: string;
    password: string;
}>;
export declare const createUserSchema: z.ZodObject<{
    email: z.ZodString;
    username: z.ZodString;
    password: z.ZodString;
    fullName: z.ZodString;
    role: z.ZodDefault<z.ZodEnum<["SUPER_ADMIN", "ADMIN", "OPERATOR", "DELEGATE"]>>;
}, "strip", z.ZodTypeAny, {
    fullName: string;
    password: string;
    email: string;
    username: string;
    role: "SUPER_ADMIN" | "ADMIN" | "OPERATOR" | "DELEGATE";
}, {
    fullName: string;
    password: string;
    email: string;
    username: string;
    role?: "SUPER_ADMIN" | "ADMIN" | "OPERATOR" | "DELEGATE" | undefined;
}>;
export declare const createSponsorSchema: z.ZodObject<{
    name: z.ZodString;
    contactName: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    logoUrl: z.ZodOptional<z.ZodString>;
    website: z.ZodOptional<z.ZodString>;
    slideUrl: z.ZodOptional<z.ZodString>;
    slideOrder: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string;
    logoUrl?: string | undefined;
    email?: string | undefined;
    contactName?: string | undefined;
    phone?: string | undefined;
    website?: string | undefined;
    slideUrl?: string | undefined;
    slideOrder?: number | undefined;
}, {
    name: string;
    logoUrl?: string | undefined;
    email?: string | undefined;
    contactName?: string | undefined;
    phone?: string | undefined;
    website?: string | undefined;
    slideUrl?: string | undefined;
    slideOrder?: number | undefined;
}>;
export declare const updateSponsorSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    contactName: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    phone: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    email: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    logoUrl: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    website: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    slideUrl: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    slideOrder: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    logoUrl?: string | undefined;
    email?: string | undefined;
    contactName?: string | undefined;
    phone?: string | undefined;
    website?: string | undefined;
    slideUrl?: string | undefined;
    slideOrder?: number | undefined;
}, {
    name?: string | undefined;
    logoUrl?: string | undefined;
    email?: string | undefined;
    contactName?: string | undefined;
    phone?: string | undefined;
    website?: string | undefined;
    slideUrl?: string | undefined;
    slideOrder?: number | undefined;
}>;
export declare const createSponsorPlanSchema: z.ZodObject<{
    name: z.ZodString;
    monthlyAmount: z.ZodNumber;
    durationMonths: z.ZodDefault<z.ZodNumber>;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    monthlyAmount: number;
    durationMonths: number;
    description?: string | undefined;
}, {
    name: string;
    monthlyAmount: number;
    description?: string | undefined;
    durationMonths?: number | undefined;
}>;
export declare const updateSponsorPlanSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    monthlyAmount: z.ZodOptional<z.ZodNumber>;
    durationMonths: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    monthlyAmount?: number | undefined;
    durationMonths?: number | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    monthlyAmount?: number | undefined;
    durationMonths?: number | undefined;
}>;
export declare const createSponsorshipSchema: z.ZodObject<{
    sponsorId: z.ZodString;
    planId: z.ZodString;
    startDate: z.ZodString;
    endDate: z.ZodString;
}, "strip", z.ZodTypeAny, {
    startDate: string;
    endDate: string;
    sponsorId: string;
    planId: string;
}, {
    startDate: string;
    endDate: string;
    sponsorId: string;
    planId: string;
}>;
export declare const createBenefitSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    imageUrl: z.ZodOptional<z.ZodString>;
    type: z.ZodDefault<z.ZodEnum<["EXTERNAL", "INTERNAL"]>>;
    sponsorId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "EXTERNAL" | "INTERNAL";
    title: string;
    description?: string | undefined;
    sponsorId?: string | undefined;
    imageUrl?: string | undefined;
}, {
    title: string;
    type?: "EXTERNAL" | "INTERNAL" | undefined;
    description?: string | undefined;
    sponsorId?: string | undefined;
    imageUrl?: string | undefined;
}>;
export declare const updateBenefitSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    imageUrl: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    type: z.ZodOptional<z.ZodDefault<z.ZodEnum<["EXTERNAL", "INTERNAL"]>>>;
    sponsorId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    type?: "EXTERNAL" | "INTERNAL" | undefined;
    description?: string | undefined;
    sponsorId?: string | undefined;
    title?: string | undefined;
    imageUrl?: string | undefined;
}, {
    type?: "EXTERNAL" | "INTERNAL" | undefined;
    description?: string | undefined;
    sponsorId?: string | undefined;
    title?: string | undefined;
    imageUrl?: string | undefined;
}>;
export declare const registerMemberSchema: z.ZodObject<{
    fullName: z.ZodString;
    dni: z.ZodString;
    email: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    username: z.ZodOptional<z.ZodString>;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    fullName: string;
    dni: string;
    password: string;
    email: string;
    address?: string | undefined;
    username?: string | undefined;
    phone?: string | undefined;
}, {
    fullName: string;
    dni: string;
    password: string;
    email: string;
    address?: string | undefined;
    username?: string | undefined;
    phone?: string | undefined;
}>;
export declare const linkPlayerSchema: z.ZodObject<{
    dni: z.ZodString;
    birthDate: z.ZodString;
}, "strip", z.ZodTypeAny, {
    dni: string;
    birthDate: string;
}, {
    dni: string;
    birthDate: string;
}>;
export declare const createJoinRequestSchema: z.ZodObject<{
    fullName: z.ZodString;
    dni: z.ZodString;
    birthDate: z.ZodString;
    categoryId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    fullName: string;
    dni: string;
    birthDate: string;
    categoryId?: string | undefined;
}, {
    fullName: string;
    dni: string;
    birthDate: string;
    categoryId?: string | undefined;
}>;
export declare const createUnlinkRequestSchema: z.ZodObject<{
    playerId: z.ZodString;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    playerId: string;
    reason?: string | undefined;
}, {
    playerId: string;
    reason?: string | undefined;
}>;
