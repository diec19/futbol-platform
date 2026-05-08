import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { db } from '../../config/database';
import { env } from '../../config/env';
import { AppError } from '../../lib/app-error';

const USER_SELECT = {
  id: true,
  email: true,
  username: true,
  fullName: true,
  role: true,
  active: true,
  createdAt: true,
} as const;

export class AuthService {
  async login(login: string, password: string) {
    const user = await db.user.findFirst({
      where: {
        OR: [{ email: login }, { username: login }],
        active: true,
      },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new AppError('Credenciales inválidas', 401);
    }

    const payload = { id: user.id, role: user.role, email: user.email };
    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
    });
    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'],
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  async refresh(token: string) {
    if (!token) throw new AppError('Refresh token requerido', 400);

    try {
      const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as {
        id: string;
        role: string;
        email: string;
      };
      const user = await db.user.findUnique({
        where: { id: payload.id, active: true },
      });
      if (!user) throw new AppError('Usuario no encontrado', 401);

      const newPayload = { id: user.id, role: user.role, email: user.email };
      const accessToken = jwt.sign(newPayload, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
      });
      return { accessToken };
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError('Refresh token inválido', 401);
    }
  }

  async me(userId: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: USER_SELECT,
    });
    if (!user) throw new AppError('Usuario no encontrado', 404);
    return user;
  }

  async createUser(data: {
    email: string;
    username: string;
    password: string;
    fullName: string;
    role: string;
  }) {
    const hashed = await bcrypt.hash(data.password, 12);
    return db.user.create({
      data: { ...data, password: hashed, role: data.role as any },
      select: USER_SELECT,
    });
  }

  async listUsers() {
    return db.user.findMany({
      select: USER_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }
}
