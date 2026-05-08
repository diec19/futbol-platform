import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { errorMiddleware } from './middleware/error.middleware';
import { authRouter } from './modules/auth/auth.router';
import { tournamentsRouter } from './modules/tournaments/tournaments.router';
import { categoriesRouter } from './modules/categories/categories.router';
import { teamsRouter } from './modules/teams/teams.router';
import { playersRouter } from './modules/players/players.router';
import { refereesRouter } from './modules/referees/referees.router';
import { matchesRouter } from './modules/matches/matches.router';
import { standingsRouter } from './modules/standings/standings.router';
import { bracketsRouter } from './modules/brackets/brackets.router';
import { statisticsRouter } from './modules/statistics/statistics.router';
import { sanctionsRouter } from './modules/sanctions/sanctions.router';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const v1 = '/api/v1';
app.use(`${v1}/auth`, authRouter);
app.use(`${v1}/tournaments`, tournamentsRouter);
app.use(`${v1}/categories`, categoriesRouter);
app.use(`${v1}/teams`, teamsRouter);
app.use(`${v1}/players`, playersRouter);
app.use(`${v1}/referees`, refereesRouter);
app.use(`${v1}/matches`, matchesRouter);
app.use(`${v1}/standings`, standingsRouter);
app.use(`${v1}/brackets`, bracketsRouter);
app.use(`${v1}/statistics`, statisticsRouter);
app.use(`${v1}/sanctions`, sanctionsRouter);

app.use(errorMiddleware);

export { app };
