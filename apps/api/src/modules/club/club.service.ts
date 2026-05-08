import { db } from '../../config/database';
import QRCode from 'qrcode';

const getOrCreateClub = async () => {
  let club = await db.club.findFirst();
  if (!club) {
    club = await db.club.create({ data: { name: 'Mi Club' } });
  }
  return club;
};

export const clubService = {
  // ── Info ────────────────────────────────────────────────────────────────
  async get() {
    return getOrCreateClub();
  },

  async update(data: {
    name?: string; shortName?: string; description?: string; foundedYear?: number;
    logo?: string; colors?: string; address?: string; phone?: string; email?: string;
    website?: string; instagram?: string; facebook?: string; whatsapp?: string;
  }) {
    const club = await getOrCreateClub();
    return db.club.update({ where: { id: club.id }, data });
  },

  // ── News ────────────────────────────────────────────────────────────────
  async listNews() {
    const club = await getOrCreateClub();
    return db.clubNews.findMany({ where: { clubId: club.id }, orderBy: { createdAt: 'desc' } });
  },

  async createNews(data: { title: string; body: string; imageUrl?: string; published?: boolean }) {
    const club = await getOrCreateClub();
    const payload = { ...data, clubId: club.id, publishedAt: data.published ? new Date() : null };
    return db.clubNews.create({ data: payload });
  },

  async updateNews(id: string, data: { title?: string; body?: string; imageUrl?: string; published?: boolean }) {
    const existing = await db.clubNews.findUniqueOrThrow({ where: { id } });
    const publishedAt = data.published && !existing.published ? new Date() : existing.publishedAt;
    return db.clubNews.update({ where: { id }, data: { ...data, publishedAt } });
  },

  async deleteNews(id: string) {
    return db.clubNews.delete({ where: { id } });
  },

  // ── Staff ───────────────────────────────────────────────────────────────
  async listStaff() {
    const club = await getOrCreateClub();
    return db.clubStaff.findMany({ where: { clubId: club.id }, orderBy: { order: 'asc' } });
  },

  async createStaff(data: { name: string; role: string; photo?: string; bio?: string; order?: number }) {
    const club = await getOrCreateClub();
    return db.clubStaff.create({ data: { ...data, clubId: club.id } });
  },

  async updateStaff(id: string, data: { name?: string; role?: string; photo?: string; bio?: string; order?: number }) {
    return db.clubStaff.update({ where: { id }, data });
  },

  async deleteStaff(id: string) {
    return db.clubStaff.delete({ where: { id } });
  },

  // ── Gallery ─────────────────────────────────────────────────────────────
  async listGallery() {
    const club = await getOrCreateClub();
    return db.clubGallery.findMany({ where: { clubId: club.id }, orderBy: { createdAt: 'desc' } });
  },

  async addPhoto(data: { url: string; caption?: string }) {
    const club = await getOrCreateClub();
    return db.clubGallery.create({ data: { ...data, clubId: club.id } });
  },

  async removePhoto(id: string) {
    return db.clubGallery.delete({ where: { id } });
  },

  // ── Fields ──────────────────────────────────────────────────────────────
  async listFields() {
    const club = await getOrCreateClub();
    return db.field.findMany({ where: { clubId: club.id }, orderBy: { name: 'asc' } });
  },

  async createField(data: { name: string; address?: string; mapUrl?: string; capacity?: number; surface?: string }) {
    const club = await getOrCreateClub();
    return db.field.create({ data: { ...data, clubId: club.id } });
  },

  async updateField(id: string, data: { name?: string; address?: string; mapUrl?: string; capacity?: number; surface?: string }) {
    return db.field.update({ where: { id }, data });
  },

  async deleteField(id: string) {
    return db.field.delete({ where: { id } });
  },

  // ── Player Credentials ──────────────────────────────────────────────────
  async generateCredential(playerId: string) {
    const player = await db.player.findUniqueOrThrow({
      where: { id: playerId },
      include: { team: { include: { category: { include: { tournament: true } } } } },
    });
    const url = `${process.env.APP_URL ?? 'https://futbolplatform.com'}/players/${playerId}`;
    const qrCode = await QRCode.toDataURL(url, { width: 300, margin: 2 });
    return db.playerCredential.upsert({
      where: { playerId },
      create: { playerId, qrCode, expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
      update: { qrCode, issuedAt: new Date(), expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
    });
  },

  async getCredential(playerId: string) {
    const player = await db.player.findUniqueOrThrow({
      where: { id: playerId },
      include: {
        credential: true,
        team: { include: { category: { include: { tournament: true } } } },
      },
    });
    return player;
  },

  // ── Club Categories ─────────────────────────────────────────────────────
  async listClubCategories() {
    return db.clubCategory.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { players: true } } },
    });
  },

  async createClubCategory(data: { name: string; description?: string; birthYear?: number; coach?: string; assistant?: string }) {
    return db.clubCategory.create({ data });
  },

  async updateClubCategory(id: string, data: { name?: string; description?: string; birthYear?: number; coach?: string; assistant?: string; active?: boolean }) {
    return db.clubCategory.update({ where: { id }, data });
  },

  async deleteClubCategory(id: string) {
    return db.clubCategory.delete({ where: { id } });
  },

  // ── Payments ────────────────────────────────────────────────────────────
  async listPayments(teamId?: string) {
    return db.payment.findMany({
      where: teamId ? { teamId } : undefined,
      include: { team: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  },

  async createPayment(data: { teamId: string; type: string; amount: number; description?: string; dueDate?: string }) {
    return db.payment.create({
      data: {
        teamId: data.teamId,
        type: data.type as any,
        amount: data.amount,
        description: data.description,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
      include: { team: { select: { name: true } } },
    });
  },

  async markPaymentPaid(id: string) {
    return db.payment.update({ where: { id }, data: { status: 'PAID', paidAt: new Date() } });
  },

  async updatePaymentStatus(id: string, status: string) {
    return db.payment.update({ where: { id }, data: { status: status as any } });
  },

  async deletePayment(id: string) {
    return db.payment.delete({ where: { id } });
  },
};
