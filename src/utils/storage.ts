import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recipe, ActivationCode, SubscriptionState, AdminSettings } from '../types';
import { INITIAL_RECIPES } from '../data/initialRecipes';
import { INITIAL_CODES } from './codeGenerator';

const RECIPES_STORAGE_KEY = '@chemclean_recipes_v4';
const CODES_STORAGE_KEY = '@chemclean_codes_v4';
const SUBSCRIPTION_STORAGE_KEY = '@chemclean_subscription_v4';
const SETTINGS_STORAGE_KEY = '@chemclean_settings_v4';
const FAVORITES_STORAGE_KEY = '@chemclean_favorites_v4';

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  requireSubscription: true,
  freeRecipesCount: 2, // First 2 recipes free for preview
  supportContact: '+966500000000',
  noticeBanner: 'مرحباً بك في المنصة الشاملة لتركيبات المنظفات الاحترافية',
};

// ================= RECIPES =================

export async function getStoredRecipes(): Promise<Recipe[]> {
  try {
    const raw = await AsyncStorage.getItem(RECIPES_STORAGE_KEY);
    if (!raw) {
      await AsyncStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify(INITIAL_RECIPES));
      return INITIAL_RECIPES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_RECIPES;
  } catch (error) {
    console.error('Error reading recipes:', error);
    return INITIAL_RECIPES;
  }
}

export async function saveRecipe(recipe: Recipe): Promise<Recipe[]> {
  const current = await getStoredRecipes();
  const existingIdx = current.findIndex(r => String(r.id) === String(recipe.id));
  
  let updated: Recipe[];
  if (existingIdx !== -1) {
    // Update existing
    updated = [...current];
    updated[existingIdx] = {
      ...recipe,
      updatedAt: new Date().toISOString(),
    };
  } else {
    // Add new
    const newRecipe = {
      ...recipe,
      id: recipe.id || Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    updated = [newRecipe, ...current];
  }

  await AsyncStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export async function deleteRecipe(recipeId: string | number): Promise<Recipe[]> {
  const current = await getStoredRecipes();
  const updated = current.filter(r => String(r.id) !== String(recipeId));
  await AsyncStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export async function restoreDefaultRecipes(): Promise<Recipe[]> {
  await AsyncStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify(INITIAL_RECIPES));
  return INITIAL_RECIPES;
}

// ================= ACTIVATION CODES =================

export async function getStoredCodes(): Promise<ActivationCode[]> {
  try {
    const raw = await AsyncStorage.getItem(CODES_STORAGE_KEY);
    if (!raw) {
      await AsyncStorage.setItem(CODES_STORAGE_KEY, JSON.stringify(INITIAL_CODES));
      return INITIAL_CODES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_CODES;
  } catch (error) {
    console.error('Error reading codes:', error);
    return INITIAL_CODES;
  }
}

export async function saveActivationCodes(codes: ActivationCode[]): Promise<void> {
  await AsyncStorage.setItem(CODES_STORAGE_KEY, JSON.stringify(codes));
}

export async function addActivationCode(code: ActivationCode): Promise<ActivationCode[]> {
  const current = await getStoredCodes();
  const updated = [code, ...current];
  await saveActivationCodes(updated);
  return updated;
}

export async function addMultipleCodes(newCodes: ActivationCode[]): Promise<ActivationCode[]> {
  const current = await getStoredCodes();
  const updated = [...newCodes, ...current];
  await saveActivationCodes(updated);
  return updated;
}

export async function toggleCodeRevoked(codeId: string): Promise<ActivationCode[]> {
  const current = await getStoredCodes();
  const updated = current.map(c => {
    if (c.id === codeId) {
      const newStatus = c.status === 'revoked' ? 'active' : 'revoked';
      return { ...c, status: newStatus as any };
    }
    return c;
  });
  await saveActivationCodes(updated);
  return updated;
}

export async function deleteCode(codeId: string): Promise<ActivationCode[]> {
  const current = await getStoredCodes();
  const updated = current.filter(c => c.id !== codeId);
  await saveActivationCodes(updated);
  return updated;
}

// ================= USER SUBSCRIPTION STATE =================

export async function getSubscriptionState(): Promise<SubscriptionState> {
  try {
    const raw = await AsyncStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
    if (!raw) {
      return {
        isSubscribed: false,
        activeCode: null,
        planName: null,
        expiresAt: null,
        isLifetime: false,
        activatedAt: null,
      };
    }
    const state: SubscriptionState = JSON.parse(raw);
    
    // Check if expired
    if (state.isSubscribed && !state.isLifetime && state.expiresAt) {
      const expDate = new Date(state.expiresAt).getTime();
      if (Date.now() > expDate) {
        state.isSubscribed = false;
        await AsyncStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(state));
      }
    }
    return state;
  } catch (error) {
    console.error('Error reading subscription state:', error);
    return {
      isSubscribed: false,
      activeCode: null,
      planName: null,
      expiresAt: null,
      isLifetime: false,
      activatedAt: null,
    };
  }
}

export async function activateUserSubscription(codeString: string): Promise<{ success: boolean; message: string; sub?: SubscriptionState }> {
  const cleaned = codeString.trim().toUpperCase();
  if (cleaned.length !== 8) {
    return { success: false, message: 'يتكون كود التفعيل من 8 خانات بالضبط (حروف لاتينية وأرقام)' };
  }

  const codes = await getStoredCodes();
  const foundCode = codes.find(c => c.code.toUpperCase() === cleaned);

  if (!foundCode) {
    return { success: false, message: 'الكود المدخل غير موجود، يرجى التأكد من الرمز المدخل' };
  }

  if (foundCode.status === 'revoked') {
    return { success: false, message: 'هذا الكود تم إلغاؤه من قبل الإدارة' };
  }

  if (foundCode.expiresAt && new Date(foundCode.expiresAt).getTime() < Date.now()) {
    return { success: false, message: 'هذا الكود انتهت صلاحيته' };
  }

  if (foundCode.maxUses > 0 && foundCode.timesUsed >= foundCode.maxUses) {
    return { success: false, message: 'تم استهلاك الحد الأقصى لاستخدام هذا الكود' };
  }

  // Update times used
  const updatedCodes = codes.map(c => {
    if (c.id === foundCode.id) {
      const newTimes = c.timesUsed + 1;
      const newStatus = (c.maxUses > 0 && newTimes >= c.maxUses) ? 'used' : c.status;
      return { ...c, timesUsed: newTimes, status: newStatus as any };
    }
    return c;
  });
  await saveActivationCodes(updatedCodes);

  // Set subscription
  const isLifetime = foundCode.plan === 'lifetime';
  let expiresAt: string | null = null;
  if (!isLifetime) {
    const exp = new Date(Date.now() + foundCode.durationDays * 24 * 60 * 60 * 1000);
    expiresAt = exp.toISOString();
  }

  const newSubState: SubscriptionState = {
    isSubscribed: true,
    activeCode: foundCode.code,
    planName: foundCode.planName,
    expiresAt,
    isLifetime,
    activatedAt: new Date().toISOString(),
  };

  await AsyncStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(newSubState));
  return { success: true, message: `تم تفعيل اشتراكك بنجاح (${foundCode.planName})! تم فتح كافة التركيبات`, sub: newSubState };
}

export async function clearUserSubscription(): Promise<void> {
  const cleared: SubscriptionState = {
    isSubscribed: false,
    activeCode: null,
    planName: null,
    expiresAt: null,
    isLifetime: false,
    activatedAt: null,
  };
  await AsyncStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(cleared));
}

// ================= ADMIN SETTINGS =================

export async function getAdminSettings(): Promise<AdminSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_ADMIN_SETTINGS;
    return { ...DEFAULT_ADMIN_SETTINGS, ...JSON.parse(raw) };
  } catch (error) {
    return DEFAULT_ADMIN_SETTINGS;
  }
}

export async function saveAdminSettings(settings: AdminSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

// ================= FAVORITES =================

export async function getFavorites(): Promise<(string | number)[]> {
  try {
    const raw = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function toggleFavorite(recipeId: string | number): Promise<(string | number)[]> {
  const favs = await getFavorites();
  const exists = favs.some(id => String(id) === String(recipeId));
  const updated = exists ? favs.filter(id => String(id) !== String(recipeId)) : [...favs, recipeId];
  await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}
