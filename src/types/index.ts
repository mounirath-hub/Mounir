export interface Ingredient {
  name: string;
  chemicalName?: string;
  percentage: number;
  role: string;
}

export interface Recipe {
  id: number | string;
  slug?: string;
  mainSection: 'car_care' | 'household' | 'furniture' | 'industrial' | string;
  mainSectionName: string;
  sectionIndex?: number;
  title: string;
  titleEn?: string;
  category: string;
  categoryName: string;
  imageUrl: string;
  shortDesc: string;
  badge?: string;
  phLevel?: string;
  phType?: 'acidic' | 'neutral' | 'alkaline' | string;
  difficulty?: 'سهل' | 'متوسط' | 'متقدم' | string;
  preparationTime?: string;
  curingTime?: string;
  appearance?: string;
  youtubeUrl?: string; // YouTube video link or ID for direct playback
  ingredients: Ingredient[];
  preparationSteps: string[];
  safetyWarnings?: string[];
  formulationTips?: string[];
  usageInstructions?: string;
  recommendedPackaging?: string;
  isFeaturedPrompt?: boolean;
  isPremium?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type PlanDurationType = 'trial' | 'monthly' | 'quarterly' | 'annual' | 'lifetime';

export interface ActivationCode {
  id: string;
  code: string; // 8 Latin characters & digits (e.g., K9X2M7P4)
  plan: PlanDurationType;
  planName: string;
  durationDays: number; // 7, 30, 90, 365, 99999
  createdAt: string;
  expiresAt?: string;
  status: 'active' | 'used' | 'revoked' | 'expired';
  maxUses: number; // 1 or -1 (unlimited)
  timesUsed: number;
  notes?: string;
  categoryScope?: string; // 'all' or specific category
}

export interface SubscriptionState {
  isSubscribed: boolean;
  activeCode: string | null;
  planName: string | null;
  expiresAt: string | null;
  isLifetime: boolean;
  activatedAt: string | null;
}

export interface AdminSettings {
  requireSubscription: boolean;
  freeRecipesCount: number; // e.g. 2 recipes free for preview
  supportContact: string;
  noticeBanner: string;
}
