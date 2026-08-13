export declare const PAGINATION: {
    readonly DEFAULT_PAGE: 1;
    readonly DEFAULT_LIMIT: 20;
    readonly MAX_LIMIT: 100;
};
export declare const JWT: {
    readonly ACCESS_EXPIRY: "15m";
    readonly REFRESH_EXPIRY: "7d";
};
export declare const POINTS: {
    readonly WIN: 3;
    readonly DRAW: 1;
    readonly LOSS: 0;
};
export declare const TOURNAMENT_STATUS: readonly ["DRAFT", "ACTIVE", "SUSPENDED", "FINISHED"];
export declare const MATCH_STATUS: readonly ["SCHEDULED", "LIVE", "FINISHED", "POSTPONED", "CANCELLED"];
export declare const EVENT_TYPE: readonly ["GOAL", "OWN_GOAL", "YELLOW_CARD", "RED_CARD", "DOUBLE_YELLOW", "MVP", "SUBSTITUTION"];
export declare const POSITION: readonly ["GOALKEEPER", "DEFENDER", "MIDFIELDER", "FORWARD"];
export declare const BRACKET_STAGE: readonly ["ROUND_OF_16", "QUARTER_FINAL", "SEMI_FINAL", "THIRD_PLACE", "FINAL"];
export declare const ROLE: readonly ["SUPER_ADMIN", "ADMIN", "OPERATOR", "DELEGATE"];
export declare const PHASE_TYPE: readonly ["GROUP", "KNOCKOUT", "MIXED"];
export declare const BRACKET_STAGE_LABELS: Record<string, string>;
export declare const POSITION_LABELS: Record<string, string>;
export declare const TOURNAMENT_STATUS_LABELS: Record<string, string>;
export declare const MATCH_STATUS_LABELS: Record<string, string>;
