import { describe, it, expect, beforeEach } from 'vitest';
import { membersService } from './members.service';
import { db } from '../../config/database';

// Helper: crea un socio y devuelve { memberId, token } via el service real
async function createMember(prefix: string) {
  const suffix = Math.random().toString(36).slice(2, 8);
  const member = await membersService.create({
    fullName: `Test ${prefix}`,
    dni: `${prefix}${suffix.slice(0, 6)}`,
    email: `${prefix}${suffix}@test.com`,
    phone: '5491145678901',
    username: `${prefix}${suffix}`,
    password: 'secret123',
  });
  const login = await membersService.login(member.username, 'secret123');
  return { member, token: login.accessToken };
}

async function createPlayer(dni: string) {
  return db.player.create({
    data: {
      fullName: 'Jugador Test',
      dni,
      birthDate: new Date('2015-05-10'),
      isClubPlayer: true,
    },
  });
}

describe('membersService integración (DB test)', () => {
  beforeEach(async () => {
    // Limpieza adicional explícita por si el setup no alcanza
    await db.member.deleteMany();
    await db.player.deleteMany();
  });

  describe('register + login', () => {
    it('crea un socio y permite loguearse con email', async () => {
      const { member, token } = await createMember('REG');
      expect(member.id).toBeDefined();
      expect(token).toBeDefined();
      // login con email en vez de username
      const login2 = await membersService.login(member.email, 'secret123');
      expect(login2.accessToken).toBeDefined();
    });

    it('no permite registrar dos socios con el mismo DNI', async () => {
      const { member } = await createMember('DUP');
      await expect(
        membersService.create({
          fullName: 'Otro',
          dni: member.dni,
          email: 'otro@test.com',
          username: 'otrouser',
          password: 'secret123',
        })
      ).rejects.toThrow('Ya existe');
    });

    it('rechaza login con contraseña incorrecta', async () => {
      const { member } = await createMember('BAD');
      await expect(membersService.login(member.username, 'wrong')).rejects.toThrow('Credenciales inválidas');
    });
  });

  describe('vinculación de jugador', () => {
    it('vincula un jugador por DNI + fecha de nacimiento', async () => {
      const player = await createPlayer('11110000');
      const { member } = await createMember('LNK');
      const link = await membersService.linkPlayerByDni(member.id, {
        dni: '11110000',
        birthDate: '2015-05-10T00:00:00.000Z',
      });
      expect(link.playerId).toBe(player.id);
      // me() devuelve el jugador vinculado
      const me = await membersService.me(member.id);
      expect(me.players.length).toBe(1);
    });

    it('rechaza si el jugador no existe', async () => {
      const { member } = await createMember('NF');
      await expect(
        membersService.linkPlayerByDni(member.id, { dni: '99999999', birthDate: '2015-01-01T00:00:00.000Z' })
      ).rejects.toThrow('no está registrado');
    });

    it('rechaza si la fecha de nacimiento no coincide', async () => {
      await createPlayer('11110001');
      const { member } = await createMember('FD');
      await expect(
        membersService.linkPlayerByDni(member.id, { dni: '11110001', birthDate: '2016-01-01T00:00:00.000Z' })
      ).rejects.toThrow('fecha de nacimiento');
    });

    it('rechaza vincular el mismo jugador dos veces', async () => {
      await createPlayer('11110002');
      const { member } = await createMember('DB');
      await membersService.linkPlayerByDni(member.id, { dni: '11110002', birthDate: '2015-05-10T00:00:00.000Z' });
      await expect(
        membersService.linkPlayerByDni(member.id, { dni: '11110002', birthDate: '2015-05-10T00:00:00.000Z' })
      ).rejects.toThrow('ya está vinculado');
    });
  });

  describe('alta de jugador con aprobación', () => {
    it('crea solicitud PENDING cuando el DNI no existe', async () => {
      const { member } = await createMember('ALT');
      const req = await membersService.createJoinRequest(member.id, {
        fullName: 'Nuevo Jugador',
        dni: '22220000',
        birthDate: '2016-03-15T00:00:00.000Z',
      });
      const saved = await db.playerJoinRequest.findUnique({ where: { id: req.id } });
      expect(saved?.status).toBe('PENDING');
    });

    it('aprueba la solicitud: crea el jugador y lo vincula', async () => {
      const { member } = await createMember('APR');
      const req = await membersService.createJoinRequest(member.id, {
        fullName: 'Aprobado',
        dni: '22220001',
        birthDate: '2016-03-15T00:00:00.000Z',
      });
      await membersService.approveJoinRequest(req.id);
      const player = await db.player.findUnique({ where: { dni: '22220001' } });
      expect(player).toBeDefined();
      const link = await db.memberPlayer.findUnique({
        where: { memberId_playerId: { memberId: member.id, playerId: player!.id } },
      });
      expect(link).toBeDefined();
    });

    it('no permite aprobar dos veces la misma solicitud', async () => {
      const { member } = await createMember('DAP');
      const req = await membersService.createJoinRequest(member.id, {
        fullName: 'Doble',
        dni: '22220002',
        birthDate: '2016-03-15T00:00:00.000Z',
      });
      await membersService.approveJoinRequest(req.id);
      await expect(membersService.approveJoinRequest(req.id)).rejects.toThrow('ya fue procesada');
    });

    it('rechaza la solicitud', async () => {
      const { member } = await createMember('REJ');
      const req = await membersService.createJoinRequest(member.id, {
        fullName: 'Rechazado',
        dni: '22220003',
        birthDate: '2016-03-15T00:00:00.000Z',
      });
      await membersService.rejectJoinRequest(req.id, 'Falta documentación');
      const updated = await db.playerJoinRequest.findUnique({ where: { id: req.id } });
      expect(updated?.status).toBe('REJECTED');
      expect(updated?.adminNote).toBe('Falta documentación');
    });
  });

  describe('desvinculación con aprobación', () => {
    it('crea solicitud PENDING de desvinculación', async () => {
      const player = await createPlayer('33330000');
      const { member } = await createMember('UNL');
      await db.memberPlayer.create({ data: { memberId: member.id, playerId: player.id } });
      const req = await membersService.createUnlinkRequest(member.id, { playerId: player.id, reason: 'Ya no juega' });
      expect(req.status).toBe('PENDING');
      expect(req.reason).toBe('Ya no juega');
    });

    it('aprueba la desvinculación: elimina el vínculo y puede marcar inactivo', async () => {
      const player = await createPlayer('33330001');
      const { member } = await createMember('UAP');
      await db.memberPlayer.create({ data: { memberId: member.id, playerId: player.id } });
      const req = await membersService.createUnlinkRequest(member.id, { playerId: player.id });
      await membersService.approveUnlinkRequest(req.id, false);
      const link = await db.memberPlayer.findUnique({
        where: { memberId_playerId: { memberId: member.id, playerId: player.id } },
      });
      expect(link).toBeNull();
      const updatedPlayer = await db.player.findUnique({ where: { id: player.id } });
      expect(updatedPlayer?.active).toBe(false);
    });

    it('no permite desvincular un jugador no vinculado', async () => {
      const player = await createPlayer('33330002');
      const { member } = await createMember('UNF');
      await expect(
        membersService.createUnlinkRequest(member.id, { playerId: player.id })
      ).rejects.toThrow('no está vinculado');
    });
  });
});