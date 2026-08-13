"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MATCH_STATUS_LABELS = exports.TOURNAMENT_STATUS_LABELS = exports.POSITION_LABELS = exports.BRACKET_STAGE_LABELS = exports.PHASE_TYPE = exports.ROLE = exports.BRACKET_STAGE = exports.POSITION = exports.EVENT_TYPE = exports.MATCH_STATUS = exports.TOURNAMENT_STATUS = exports.POINTS = exports.JWT = exports.PAGINATION = void 0;
exports.PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
};
exports.JWT = {
    ACCESS_EXPIRY: '15m',
    REFRESH_EXPIRY: '7d',
};
exports.POINTS = {
    WIN: 3,
    DRAW: 1,
    LOSS: 0,
};
exports.TOURNAMENT_STATUS = ['DRAFT', 'ACTIVE', 'SUSPENDED', 'FINISHED'];
exports.MATCH_STATUS = ['SCHEDULED', 'LIVE', 'FINISHED', 'POSTPONED', 'CANCELLED'];
exports.EVENT_TYPE = ['GOAL', 'OWN_GOAL', 'YELLOW_CARD', 'RED_CARD', 'DOUBLE_YELLOW', 'MVP', 'SUBSTITUTION'];
exports.POSITION = ['GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'FORWARD'];
exports.BRACKET_STAGE = ['ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL'];
exports.ROLE = ['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'DELEGATE'];
exports.PHASE_TYPE = ['GROUP', 'KNOCKOUT', 'MIXED'];
exports.BRACKET_STAGE_LABELS = {
    ROUND_OF_16: 'Octavos de Final',
    QUARTER_FINAL: 'Cuartos de Final',
    SEMI_FINAL: 'Semifinal',
    THIRD_PLACE: 'Tercer Puesto',
    FINAL: 'Final',
};
exports.POSITION_LABELS = {
    GOALKEEPER: 'Arquero',
    DEFENDER: 'Defensor',
    MIDFIELDER: 'Mediocampista',
    FORWARD: 'Delantero',
};
exports.TOURNAMENT_STATUS_LABELS = {
    DRAFT: 'Borrador',
    ACTIVE: 'Activo',
    SUSPENDED: 'Suspendido',
    FINISHED: 'Finalizado',
};
exports.MATCH_STATUS_LABELS = {
    SCHEDULED: 'Programado',
    LIVE: 'En Juego',
    FINISHED: 'Finalizado',
    POSTPONED: 'Postergado',
    CANCELLED: 'Cancelado',
};
//# sourceMappingURL=index.js.map