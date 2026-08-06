import { z } from 'zod';

const optionalNumberString = z
  .string()
  .refine(
    (v) => v === '' || (!Number.isNaN(Number(v)) && Number(v) >= 0),
    { message: 'Ingresá un número válido' }
  )
  .optional();

export const tournamentFormSchema = z
  .object({
    name: z.string().min(1, 'El nombre es requerido'),
    description: z.string().optional(),
    startDate: z.string().min(1, 'La fecha de inicio es requerida'),
    endDate: z.string().min(1, 'La fecha de fin es requerida'),
    sponsor: z.string().optional(),
    rules: z.string().optional(),
    status: z.enum(['DRAFT', 'ACTIVE', 'SUSPENDED', 'FINISHED']),
  })
  .refine(
    (data) =>
      !data.startDate || !data.endDate || new Date(data.endDate) >= new Date(data.startDate),
    { message: 'La fecha de fin debe ser posterior a la de inicio', path: ['endDate'] }
  );
export type TournamentFormValues = z.infer<typeof tournamentFormSchema>;

export const categoryFormSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  birthYear: optionalNumberString,
  minAge: optionalNumberString,
  maxAge: optionalNumberString,
  maxPlayers: z
    .string()
    .refine((v) => Number(v) > 0 && Number.isInteger(Number(v)), 'Debe ser mayor a 0'),
  phaseType: z.enum(['MIXED', 'GROUP', 'KNOCKOUT']),
  rules: z.string().optional(),
});
export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export const teamFormSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  delegateName: z.string().optional(),
  delegateContact: z.string().optional(),
  categoryId: z.string().min(1, 'Seleccioná una categoría'),
});
export type TeamFormValues = z.infer<typeof teamFormSchema>;

export const benefitFormSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  type: z.enum(['EXTERNAL', 'INTERNAL']),
  sponsorId: z.string().optional(),
});
export type BenefitFormValues = z.infer<typeof benefitFormSchema>;

export const loginFormSchema = z.object({
  login: z.string().min(1, 'El usuario es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});
export type LoginFormValues = z.infer<typeof loginFormSchema>;
