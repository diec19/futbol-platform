import { createMemberMpPreference } from '../../lib/mp';

export const mpService = {
  async createPreference(
    sub: { id: string; month: number; year: number; amount: number; dueDate: Date },
    member: { email: string; fullName: string },
    childSubs: { id: string; player: { fullName: string }; amount: number }[] = [],
    customAmount?: number,
  ) {
    return createMemberMpPreference(sub, member, childSubs, customAmount);
  },
};
