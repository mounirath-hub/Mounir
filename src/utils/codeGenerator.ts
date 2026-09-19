import { ActivationCode, PlanDurationType } from '../types';

// Admin Secret Password from user prompt
export const ADMIN_SECRET_KEY = 'mounirath1977@';

// Latin characters (A-Z) and numbers (0-9) - avoiding ambiguous chars like 0/O, 1/I optionally, but standard uppercase Latin + digits
const LATIN_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Generates an 8-character code consisting of Latin letters and numbers
 * Example: K9X2M7P4, 7H3J9X4Q
 */
export function generate8CharCode(): string {
  let result = '';
  const length = 8;
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * LATIN_CHARSET.length);
    result += LATIN_CHARSET.charAt(randomIndex);
  }
  return result;
}

export function getPlanDetails(plan: PlanDurationType): { planName: string; durationDays: number } {
  switch (plan) {
    case 'trial':
      return { planName: 'تجريبي (7 أيام)', durationDays: 7 };
    case 'monthly':
      return { planName: 'شهري (30 يوم)', durationDays: 30 };
    case 'quarterly':
      return { planName: 'فصلي (3 أشهر)', durationDays: 90 };
    case 'annual':
      return { planName: 'سنوي (سنة كاملة)', durationDays: 365 };
    case 'lifetime':
      return { planName: 'مدى الحياة (وصول غير محدود)', durationDays: 99999 };
    default:
      return { planName: 'شهري (30 يوم)', durationDays: 30 };
  }
}

/**
 * Creates a new ActivationCode object
 */
export function createActivationCode(
  plan: PlanDurationType = 'annual',
  notes: string = '',
  maxUses: number = 1,
  categoryScope: string = 'all',
  customCode?: string
): ActivationCode {
  const code = (customCode && customCode.trim().length === 8)
    ? customCode.trim().toUpperCase()
    : generate8CharCode();

  const { planName, durationDays } = getPlanDetails(plan);
  const now = new Date();
  
  let expiresAt: string | undefined = undefined;
  if (plan !== 'lifetime') {
    const exp = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
    expiresAt = exp.toISOString();
  }

  return {
    id: `code_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    code,
    plan,
    planName,
    durationDays,
    createdAt: now.toISOString(),
    expiresAt,
    status: 'active',
    maxUses,
    timesUsed: 0,
    notes: notes || 'تم الإنشاء بواسطة الإدارة',
    categoryScope,
  };
}

/**
 * Initial sample activation codes available out of the box
 */
export const INITIAL_CODES: ActivationCode[] = [
  {
    id: 'code_demo_1',
    code: 'VIP88888',
    plan: 'lifetime',
    planName: 'مدى الحياة (وصول غير محدود)',
    durationDays: 99999,
    createdAt: new Date().toISOString(),
    status: 'active',
    maxUses: -1,
    timesUsed: 0,
    notes: 'كود VIP تجريبي دائم لجميع التركيبات',
    categoryScope: 'all',
  },
  {
    id: 'code_demo_2',
    code: 'CHEM2026',
    plan: 'annual',
    planName: 'سنوي (سنة كاملة)',
    durationDays: 365,
    createdAt: new Date().toISOString(),
    status: 'active',
    maxUses: 10,
    timesUsed: 0,
    notes: 'كود سنوي شامل لمنظفات السيارات والمنزل',
    categoryScope: 'all',
  },
  {
    id: 'code_demo_3',
    code: 'K9X2M7P4',
    plan: 'monthly',
    planName: 'شهري (30 يوم)',
    durationDays: 30,
    createdAt: new Date().toISOString(),
    status: 'active',
    maxUses: 5,
    timesUsed: 0,
    notes: 'كود شهري 8 حروف تم إنشاؤه مسبقاً',
    categoryScope: 'all',
  },
  {
    id: 'code_demo_4',
    code: 'AUTO7788',
    plan: 'quarterly',
    planName: 'فصلي (3 أشهر)',
    durationDays: 90,
    createdAt: new Date().toISOString(),
    status: 'active',
    maxUses: 5,
    timesUsed: 0,
    notes: 'كود عناية بالسيارات والكنب 3 أشهر',
    categoryScope: 'all',
  },
];
