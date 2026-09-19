import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Alert,
  Platform,
  Share,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import {
  Recipe,
  ActivationCode,
  PlanDurationType,
  AdminSettings,
  SubscriptionState,
} from '../types';
import {
  getStoredRecipes,
  saveRecipe,
  deleteRecipe,
  restoreDefaultRecipes,
  getStoredCodes,
  addMultipleCodes,
  toggleCodeRevoked,
  deleteCode,
  getAdminSettings,
  saveAdminSettings,
  getSubscriptionState,
  activateUserSubscription,
  clearUserSubscription,
} from '../utils/storage';
import { generate8CharCode, createActivationCode } from '../utils/codeGenerator';
import { RecipeFormModal } from '../components/RecipeFormModal';
import { extractYouTubeId } from '../utils/youtube';

interface AdminScreenProps {
  onClose: () => void;
  onRefreshData?: () => void;
}

export const AdminScreen: React.FC<AdminScreenProps> = ({ onClose, onRefreshData }) => {
  const [activeTab, setActiveTab] = useState<'generator' | 'recipes' | 'settings'>('generator');
  
  // Data states
  const [codes, setCodes] = useState<ActivationCode[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [settings, setSettings] = useState<AdminSettings>({
    requireSubscription: true,
    freeRecipesCount: 2,
    supportContact: '+966500000000',
    noticeBanner: 'مرحباً بك في المنصة الشاملة لتركيبات المنظفات الاحترافية',
  });
  const [currentSub, setCurrentSub] = useState<SubscriptionState>({
    isSubscribed: false,
    activeCode: null,
    planName: null,
    expiresAt: null,
    isLifetime: false,
    activatedAt: null,
  });

  // Generator form states
  const [genCount, setGenCount] = useState<number>(1);
  const [genPlan, setGenPlan] = useState<PlanDurationType>('annual');
  const [genNotes, setGenNotes] = useState<string>('');
  const [genScope, setGenScope] = useState<string>('all');
  const [customCodeInput, setCustomCodeInput] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search & filters
  const [codeSearch, setCodeSearch] = useState<string>('');
  const [codeFilterStatus, setCodeFilterStatus] = useState<string>('all');
  const [recipeSearch, setRecipeSearch] = useState<string>('');
  const [recipeSectionFilter, setRecipeSectionFilter] = useState<string>('all');

  // Recipe edit modal
  const [isRecipeModalVisible, setIsRecipeModalVisible] = useState<boolean>(false);
  const [selectedRecipeToEdit, setSelectedRecipeToEdit] = useState<Recipe | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    const loadedRecipes = await getStoredRecipes();
    const loadedCodes = await getStoredCodes();
    const loadedSettings = await getAdminSettings();
    const loadedSub = await getSubscriptionState();

    setRecipes(loadedRecipes);
    setCodes(loadedCodes);
    setSettings(loadedSettings);
    setCurrentSub(loadedSub);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // ================= GENERATOR LOGIC =================

  const handleGenerateCodes = async () => {
    const newCodes: ActivationCode[] = [];

    if (customCodeInput.trim().length === 8) {
      // Single custom 8-character code
      newCodes.push(
        createActivationCode(
          genPlan,
          genNotes.trim() || 'كود مخصص 8 حروف',
          1,
          genScope,
          customCodeInput.trim()
        )
      );
      setCustomCodeInput('');
    } else {
      // Generate genCount 8-character codes
      for (let i = 0; i < genCount; i++) {
        newCodes.push(
          createActivationCode(
            genPlan,
            genNotes.trim() || `كود مولد رقم ${i + 1}`,
            1,
            genScope
          )
        );
      }
    }

    const updated = await addMultipleCodes(newCodes);
    setCodes(updated);
    showToast(`تم بنجاح توليد ${newCodes.length} كود مواد جديد (8 خانات)!`);
    setGenNotes('');
  };

  const handleCopyCode = async (codeStr: string) => {
    try {
      await Clipboard.setStringAsync(codeStr);
      showToast(`تم نسخ الكود ${codeStr} إلى الحافظة!`);
    } catch {
      showToast(`تم نسخ الكود: ${codeStr}`);
    }
  };

  const handleShareCode = async (c: ActivationCode) => {
    try {
      const message = `كود تفعيل اشتراك المواد الكيميائية: ${c.code}\nالخطة: ${c.planName}\nالصلاحية: 8 حروف وأرقام.\nأدخل الكود في التطبيق لفتح جميع الوصفات والفيديوهات مباشرة!`;
      await Share.share({ message });
    } catch (e) {
      handleCopyCode(c.code);
    }
  };

  const handleApplyCodeOnDevice = async (codeStr: string) => {
    const res = await activateUserSubscription(codeStr);
    if (res.success && res.sub) {
      setCurrentSub(res.sub);
      showToast(`تم تفعيل الكود ${codeStr} على هذا الجهاز بنجاح!`);
      const updatedCodes = await getStoredCodes();
      setCodes(updatedCodes);
      if (onRefreshData) onRefreshData();
    } else {
      showToast(res.message);
    }
  };

  const handleToggleCodeStatus = async (id: string) => {
    const updated = await toggleCodeRevoked(id);
    setCodes(updated);
    showToast('تم تغيير حالة الكود بنجاح');
  };

  const handleDeleteCode = async (id: string) => {
    const updated = await deleteCode(id);
    setCodes(updated);
    showToast('تم حذف الكود');
  };

  // ================= SETTINGS LOGIC =================

  const handleToggleRequireSub = async (val: boolean) => {
    const updated = { ...settings, requireSubscription: val };
    setSettings(updated);
    await saveAdminSettings(updated);
    showToast(val ? 'تم تفعيل إلزام الاشتراك لمشاهدة الوصفات' : 'تم تعطيل الحظر - التطبيق متاح للجميع مجاناً');
    if (onRefreshData) onRefreshData();
  };

  const handleSetFreeCount = async (count: number) => {
    const updated = { ...settings, freeRecipesCount: count };
    setSettings(updated);
    await saveAdminSettings(updated);
    showToast(`عدد الوصفات التجريبية المجانية: ${count}`);
    if (onRefreshData) onRefreshData();
  };

  const handleDeviceDeactivate = async () => {
    await clearUserSubscription();
    setCurrentSub({
      isSubscribed: false,
      activeCode: null,
      planName: null,
      expiresAt: null,
      isLifetime: false,
      activatedAt: null,
    });
    showToast('تم إلغاء تفعيل هذا الجهاز (أصبح كزائر بدون اشتراك)');
    if (onRefreshData) onRefreshData();
  };

  const handleDeviceInstantVIP = async () => {
    const res = await activateUserSubscription('VIP88888');
    if (res.sub) {
      setCurrentSub(res.sub);
      showToast('تم إعطاء هذا الجهاز صلاحية VIP مدى الحياة!');
      if (onRefreshData) onRefreshData();
    }
  };

  // ================= RECIPES LOGIC =================

  const handleOpenAddRecipe = () => {
    setSelectedRecipeToEdit(null);
    setIsRecipeModalVisible(true);
  };

  const handleOpenEditRecipe = (recipe: Recipe) => {
    setSelectedRecipeToEdit(recipe);
    setIsRecipeModalVisible(true);
  };

  const handleSaveRecipe = async (saved: Recipe) => {
    const updated = await saveRecipe(saved);
    setRecipes(updated);
    setIsRecipeModalVisible(false);
    showToast('تم حفظ التركيبة بنجاح!');
    if (onRefreshData) onRefreshData();
  };

  const handleDeleteRecipe = async (recipeId: string | number) => {
    const updated = await deleteRecipe(recipeId);
    setRecipes(updated);
    showToast('تم حذف التركيبة من النظام');
    if (onRefreshData) onRefreshData();
  };

  const handleRestoreDefaults = async () => {
    const restored = await restoreDefaultRecipes();
    setRecipes(restored);
    showToast(`تم استعادة كافة الوصفات الافتراضية (${restored.length} تركيبة) بنجاح!`);
    if (onRefreshData) onRefreshData();
  };

  // Filtered codes
  const filteredCodes = codes.filter((c) => {
    const matchSearch =
      c.code.toLowerCase().includes(codeSearch.toLowerCase()) ||
      (c.notes && c.notes.toLowerCase().includes(codeSearch.toLowerCase()));
    if (!matchSearch) return false;
    if (codeFilterStatus === 'all') return true;
    return c.status === codeFilterStatus;
  });

  // Filtered recipes
  const filteredRecipes = recipes.filter((r) => {
    const matchSearch =
      r.title.toLowerCase().includes(recipeSearch.toLowerCase()) ||
      (r.titleEn && r.titleEn.toLowerCase().includes(recipeSearch.toLowerCase())) ||
      r.categoryName.toLowerCase().includes(recipeSearch.toLowerCase());
    if (!matchSearch) return false;
    if (recipeSectionFilter === 'all') return true;
    return r.mainSection === recipeSectionFilter;
  });

  return (
    <View style={styles.container}>
      {/* Admin Top Header */}
      <View style={styles.topBar}>
        <View style={styles.topBarRight}>
          <View style={styles.adminBadge}>
            <Ionicons name="shield-checkmark" size={16} color="#38BDF8" />
            <Text style={styles.adminBadgeText}>أدمن النظام (mounirath1977@)</Text>
          </View>
        </View>

        <TouchableOpacity onPress={onClose} style={styles.closeHeaderBtn} activeOpacity={0.8}>
          <Text style={styles.closeHeaderBtnText}>إغلاق الواجهة</Text>
          <Ionicons name="close" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Toast Alert */}
      {toastMessage && (
        <View style={styles.toastBox}>
          <Ionicons name="information-circle" size={18} color="#FFFFFF" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* Tab Navigation */}
      <View style={styles.tabNav}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'generator' && styles.tabBtnActive]}
          onPress={() => setActiveTab('generator')}
        >
          <Ionicons
            name="key-outline"
            size={18}
            color={activeTab === 'generator' ? '#0284C7' : '#64748B'}
          />
          <Text
            style={[styles.tabBtnText, activeTab === 'generator' && styles.tabBtnTextActive]}
          >
            مولد المواد (8 خانات)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'recipes' && styles.tabBtnActive]}
          onPress={() => setActiveTab('recipes')}
        >
          <Ionicons
            name="flask-outline"
            size={18}
            color={activeTab === 'recipes' ? '#0284C7' : '#64748B'}
          />
          <Text style={[styles.tabBtnText, activeTab === 'recipes' && styles.tabBtnTextActive]}>
            إدارة الوصفات ({recipes.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'settings' && styles.tabBtnActive]}
          onPress={() => setActiveTab('settings')}
        >
          <Ionicons
            name="options-outline"
            size={18}
            color={activeTab === 'settings' ? '#0284C7' : '#64748B'}
          />
          <Text
            style={[styles.tabBtnText, activeTab === 'settings' && styles.tabBtnTextActive]}
          >
            التحكم بالاشتراك
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Tab Content */}
      <ScrollView style={styles.contentBody} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* ================= TAB 1: 8-CHAR CODE GENERATOR ================= */}
        {activeTab === 'generator' && (
          <View>
            {/* Generator Card */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="sparkles" size={22} color="#0284C7" />
                <Text style={styles.cardTitle}>مولد المواد والأكواد (8 حروف لاتينية وأرقام)</Text>
              </View>
              <Text style={styles.cardSubtitle}>
                توليد أكواد التفعيل المكونة من 8 خانات لاتينية وأرقام (مثل: K9X2M7P4) لتمكين المستخدمين من فتح الوصفات والفيديوهات
              </Text>

              {/* Plan Duration Selector */}
              <Text style={styles.fieldLabel}>مدة وخطة الاشتراك:</Text>
              <View style={styles.chipsGrid}>
                {[
                  { key: 'trial', label: 'تجريبي (7 أيام)' },
                  { key: 'monthly', label: 'شهري (30 يوم)' },
                  { key: 'quarterly', label: 'فصلي (3 أشهر)' },
                  { key: 'annual', label: 'سنوي (سنة كاملة)' },
                  { key: 'lifetime', label: 'VIP مدى الحياة' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.chipItem, genPlan === item.key && styles.chipItemActive]}
                    onPress={() => setGenPlan(item.key as any)}
                  >
                    <Text
                      style={[
                        styles.chipItemText,
                        genPlan === item.key && styles.chipItemTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Number of codes to generate */}
              <Text style={styles.fieldLabel}>عدد الأكواد المطلوبة للتوليد:</Text>
              <View style={styles.counterRow}>
                {[1, 3, 5, 10].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={[styles.counterBtn, genCount === num && styles.counterBtnActive]}
                    onPress={() => setGenCount(num)}
                  >
                    <Text
                      style={[
                        styles.counterBtnText,
                        genCount === num && styles.counterBtnTextActive,
                      ]}
                    >
                      {num} {num === 1 ? 'كود واحد' : 'أكواد'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Client Note / Name */}
              <Text style={styles.fieldLabel}>اسم العميل / ملاحظة (اختياري):</Text>
              <TextInput
                style={styles.adminInput}
                placeholder="مثال: ورشة السلام - الرياض / عميل تيليجرام"
                placeholderTextColor="#94A3B8"
                value={genNotes}
                onChangeText={setGenNotes}
                textAlign="right"
              />

              {/* Custom Code Option */}
              <Text style={styles.fieldLabel}>أو كود مخصص (8 خانات حروف وأرقام):</Text>
              <TextInput
                style={[styles.adminInput, { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', letterSpacing: 2 }]}
                placeholder="مثال: CHEM2026 أو اتركه فارغاً للتوليد العشوائي"
                placeholderTextColor="#94A3B8"
                value={customCodeInput}
                onChangeText={(val) => setCustomCodeInput(val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
                maxLength={8}
                textAlign="center"
              />

              {/* Generate Button */}
              <TouchableOpacity
                style={styles.generateActionBtn}
                onPress={handleGenerateCodes}
                activeOpacity={0.85}
              >
                <Ionicons name="key" size={20} color="#FFFFFF" />
                <Text style={styles.generateActionBtnText}>
                  توليد {customCodeInput.length === 8 ? 'الكود المخصص' : `${genCount} كود جديد`} الآن
                </Text>
              </TouchableOpacity>
            </View>

            {/* Generated Codes List */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="list-outline" size={20} color="#0284C7" />
                <Text style={styles.cardTitle}>سجل أكواد المواد المولدة ({filteredCodes.length})</Text>
              </View>

              {/* Search & Status Filters */}
              <View style={styles.filterBar}>
                <TextInput
                  style={styles.searchCodesInput}
                  placeholder="بحث في الأكواد أو الملاحظات..."
                  placeholderTextColor="#94A3B8"
                  value={codeSearch}
                  onChangeText={setCodeSearch}
                  textAlign="right"
                />

                <View style={styles.statusChipsRow}>
                  {[
                    { key: 'all', label: 'الكل' },
                    { key: 'active', label: 'نشط' },
                    { key: 'used', label: 'مستخدم' },
                    { key: 'revoked', label: 'ملغى' },
                  ].map((st) => (
                    <TouchableOpacity
                      key={st.key}
                      style={[
                        styles.statusChip,
                        codeFilterStatus === st.key && styles.statusChipActive,
                      ]}
                      onPress={() => setCodeFilterStatus(st.key)}
                    >
                      <Text
                        style={[
                          styles.statusChipText,
                          codeFilterStatus === st.key && styles.statusChipTextActive,
                        ]}
                      >
                        {st.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* List */}
              {filteredCodes.length === 0 ? (
                <View style={styles.emptyList}>
                  <Ionicons name="document-text-outline" size={36} color="#CBD5E1" />
                  <Text style={styles.emptyListText}>لا توجد أكواد مطابقة لمعايير البحث</Text>
                </View>
              ) : (
                filteredCodes.map((item) => (
                  <View
                    key={item.id}
                    style={[
                      styles.codeCard,
                      item.status === 'revoked' && styles.codeCardRevoked,
                      item.status === 'used' && styles.codeCardUsed,
                    ]}
                  >
                    <View style={styles.codeCardTop}>
                      {/* Code string */}
                      <View style={styles.codeBadge}>
                        <Text style={styles.codeText}>{item.code}</Text>
                      </View>

                      {/* Plan and status */}
                      <View style={styles.codePlanBadge}>
                        <Text style={styles.codePlanText}>{item.planName}</Text>
                      </View>

                      <View
                        style={[
                          styles.codeStatusBadge,
                          item.status === 'active' && styles.statusActive,
                          item.status === 'used' && styles.statusUsed,
                          item.status === 'revoked' && styles.statusRevoked,
                        ]}
                      >
                        <Text style={styles.codeStatusText}>
                          {item.status === 'active'
                            ? 'نشط'
                            : item.status === 'used'
                            ? 'مستخدم'
                            : 'ملغى'}
                        </Text>
                      </View>
                    </View>

                    {item.notes ? (
                      <Text style={styles.codeNotes}>ملاحظة: {item.notes}</Text>
                    ) : null}

                    {item.expiresAt ? (
                      <Text style={styles.codeDate}>
                        ينتهي: {new Date(item.expiresAt).toLocaleDateString('ar-EG')}
                      </Text>
                    ) : (
                      <Text style={styles.codeDate}>الصلاحية: غير محدودة (VIP)</Text>
                    )}

                    {/* Actions Row */}
                    <View style={styles.codeActionsRow}>
                      <TouchableOpacity
                        style={styles.actionBtnPrimary}
                        onPress={() => handleCopyCode(item.code)}
                      >
                        <Ionicons name="copy-outline" size={14} color="#0284C7" />
                        <Text style={styles.actionBtnPrimaryText}>نسخ</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.actionBtnPrimary}
                        onPress={() => handleShareCode(item)}
                      >
                        <Ionicons name="share-social-outline" size={14} color="#0284C7" />
                        <Text style={styles.actionBtnPrimaryText}>مشاركة</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.actionBtnSecondary}
                        onPress={() => handleApplyCodeOnDevice(item.code)}
                      >
                        <Ionicons name="flash-outline" size={14} color="#059669" />
                        <Text style={styles.actionBtnSecondaryText}>تطبيق للتجربة</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.actionBtnDanger}
                        onPress={() => handleToggleCodeStatus(item.id)}
                      >
                        <Ionicons
                          name={item.status === 'revoked' ? 'checkmark-outline' : 'ban-outline'}
                          size={14}
                          color="#DC2626"
                        />
                        <Text style={styles.actionBtnDangerText}>
                          {item.status === 'revoked' ? 'تفعيل' : 'إلغاء'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.actionBtnTrash}
                        onPress={() => handleDeleteCode(item.id)}
                      >
                        <Ionicons name="trash-outline" size={14} color="#94A3B8" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {/* ================= TAB 2: RECIPE MANAGEMENT ================= */}
        {activeTab === 'recipes' && (
          <View>
            {/* Top Bar for Recipes */}
            <View style={styles.card}>
              <View style={styles.recipesControlHeader}>
                <View>
                  <Text style={styles.cardTitle}>إدارة التركيبات والوصفات</Text>
                  <Text style={styles.cardSubtitle}>
                    إجمالي الوصفات في قاعدة البيانات: {recipes.length} تركيبة صناعية
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.addNewRecipeBtn}
                  onPress={handleOpenAddRecipe}
                  activeOpacity={0.85}
                >
                  <Ionicons name="add-circle" size={18} color="#FFFFFF" />
                  <Text style={styles.addNewRecipeBtnText}>إضافة وصفة جديدة</Text>
                </TouchableOpacity>
              </View>

              {/* Search & Section Filter */}
              <TextInput
                style={styles.adminInput}
                placeholder="ابحث باسم التركيبة، المادة، أو التصنيف..."
                placeholderTextColor="#94A3B8"
                value={recipeSearch}
                onChangeText={setRecipeSearch}
                textAlign="right"
              />

              <View style={styles.chipsGrid}>
                {[
                  { key: 'all', label: 'الكل' },
                  { key: 'car_care', label: '🚗 قسم العناية بالسيارات' },
                  { key: 'household', label: '🏠 قسم مواد التنظيف المنزلية' },
                ].map((s) => (
                  <TouchableOpacity
                    key={s.key}
                    style={[
                      styles.chipItem,
                      recipeSectionFilter === s.key && styles.chipItemActive,
                    ]}
                    onPress={() => setRecipeSectionFilter(s.key)}
                  >
                    <Text
                      style={[
                        styles.chipItemText,
                        recipeSectionFilter === s.key && styles.chipItemTextActive,
                      ]}
                    >
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Recipes List */}
            {filteredRecipes.map((r) => {
              const hasVideo = Boolean(extractYouTubeId(r.youtubeUrl));
              return (
                <View key={r.id} style={styles.recipeAdminCard}>
                  <View style={styles.recipeAdminTop}>
                    <View style={styles.recipeAdminInfo}>
                      <View style={styles.recipeTitleRow}>
                        <Text style={styles.recipeAdminTitle}>{r.title}</Text>
                        {hasVideo && (
                          <View style={styles.youtubeSmallBadge}>
                            <Ionicons name="logo-youtube" size={12} color="#FFFFFF" />
                            <Text style={styles.youtubeSmallBadgeText}>يوتيوب</Text>
                          </View>
                        )}
                      </View>
                      {r.titleEn && <Text style={styles.recipeAdminTitleEn}>{r.titleEn}</Text>}
                      <View style={styles.recipeAdminTagsRow}>
                        <Text style={styles.recipeAdminCategory}>{r.categoryName}</Text>
                        <Text style={styles.recipeAdminPh}>pH: {r.phLevel || '7.0'}</Text>
                        <Text style={styles.recipeAdminIngCount}>{r.ingredients.length} مكونات</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.recipeAdminActions}>
                    <TouchableOpacity
                      style={styles.recipeActionEdit}
                      onPress={() => handleOpenEditRecipe(r)}
                    >
                      <Ionicons name="create-outline" size={16} color="#0284C7" />
                      <Text style={styles.recipeActionEditText}>تعديل التركيبة والفيديو</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.recipeActionDelete}
                      onPress={() => handleDeleteRecipe(r.id)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                      <Text style={styles.recipeActionDeleteText}>حذف</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            {/* Restore defaults button */}
            <TouchableOpacity
              style={styles.restoreDefaultsBtn}
              onPress={handleRestoreDefaults}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh-outline" size={18} color="#64748B" />
              <Text style={styles.restoreDefaultsText}>
                استعادة الـ 31 تركيبة الافتراضية الأصلية
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ================= TAB 3: SUBSCRIPTION CONTROL & SETTINGS ================= */}
        {activeTab === 'settings' && (
          <View>
            {/* System Subscription Mode Toggle */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="shield-outline" size={22} color="#0284C7" />
                <Text style={styles.cardTitle}>التحكم في نظام الاشتراك والأقفال</Text>
              </View>
              <Text style={styles.cardSubtitle}>
                تحديد ما إذا كان يتوجب على المستخدمين إدخال كود التفعيل المكون من 8 خانات لتصفح الوصفات
              </Text>

              <View style={styles.settingToggleRow}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={styles.settingTitle}>إلزام إدخال كود الاشتراك للمستخدمين</Text>
                  <Text style={styles.settingDesc}>
                    عند التفعيل، لن يتمكن المستخدم من فتح الوصفات المحمية إلا بعد إدخال كود مكون من 8 خانات
                  </Text>
                </View>
                <Switch
                  value={settings.requireSubscription}
                  onValueChange={handleToggleRequireSub}
                  trackColor={{ false: '#CBD5E1', true: '#0284C7' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.divider} />

              {/* Free Preview Recipes Count */}
              <Text style={styles.fieldLabel}>
                عدد الوصفات المجانية المتاحة للمعاينة بدون كود:
              </Text>
              <View style={styles.counterRow}>
                {[0, 1, 2, 3, 5].map((cnt) => (
                  <TouchableOpacity
                    key={cnt}
                    style={[
                      styles.counterBtn,
                      settings.freeRecipesCount === cnt && styles.counterBtnActive,
                    ]}
                    onPress={() => handleSetFreeCount(cnt)}
                  >
                    <Text
                      style={[
                        styles.counterBtnText,
                        settings.freeRecipesCount === cnt && styles.counterBtnTextActive,
                      ]}
                    >
                      {cnt === 0 ? 'مغلق تماماً' : `${cnt} وصفات`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Current Device Test Control */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="phone-portrait-outline" size={22} color="#0284C7" />
                <Text style={styles.cardTitle}>حالة الاشتراك على هذا الجهاز (للتجربة)</Text>
              </View>

              <View style={styles.deviceStatusBox}>
                <Text style={styles.deviceStatusTitle}>
                  الحالة الحالية:{' '}
                  <Text style={{ color: currentSub.isSubscribed ? '#10B981' : '#EF4444' }}>
                    {currentSub.isSubscribed ? `مفعّل (${currentSub.planName})` : 'غير مفعّل (نسخة مجانية)'}
                  </Text>
                </Text>
                {currentSub.activeCode && (
                  <Text style={styles.deviceStatusCode}>الكود: {currentSub.activeCode}</Text>
                )}
              </View>

              <View style={styles.deviceActionRow}>
                <TouchableOpacity
                  style={styles.deviceInstantBtn}
                  onPress={handleDeviceInstantVIP}
                >
                  <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                  <Text style={styles.deviceInstantBtnText}>إعطاء تفعيل VIP للجهاز</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deviceResetBtn}
                  onPress={handleDeviceDeactivate}
                >
                  <Ionicons name="refresh" size={16} color="#DC2626" />
                  <Text style={styles.deviceResetBtnText}>إلغاء الاشتراك (وضع الزائر)</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Security info card */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="lock-closed-outline" size={20} color="#0284C7" />
                <Text style={styles.cardTitle}>بيانات الأمان الخاصة بالأدمن</Text>
              </View>
              <Text style={styles.securityText}>
                الرقم السري للأدمن: <Text style={styles.secretText}>mounirath1977@</Text>
              </Text>
              <Text style={styles.securitySub}>
                يمكن الدخول لهذه اللوحة في أي وقت بالضغط على أيقونة القفل أو زر بوابة الأدمن مع إدخال الرقم السري.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Recipe Form Modal */}
      <RecipeFormModal
        visible={isRecipeModalVisible}
        recipeToEdit={selectedRecipeToEdit}
        onClose={() => setIsRecipeModalVisible(false)}
        onSave={handleSaveRecipe}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  topBar: {
    backgroundColor: '#1E293B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0369A1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
  },
  adminBadgeText: {
    color: '#F0F9FF',
    fontSize: 12,
    fontWeight: '700',
  },
  closeHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  closeHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  toastBox: {
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    justifyContent: 'center',
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  tabNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: '#0284C7',
    backgroundColor: '#F0F9FF',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#0284C7',
    fontWeight: '700',
  },
  contentBody: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    padding: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'right',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
    lineHeight: 18,
    textAlign: 'right',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
    marginTop: 6,
    textAlign: 'right',
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chipItem: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipItemActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  chipItemText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  chipItemTextActive: {
    color: '#FFFFFF',
  },
  counterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  counterBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  counterBtnActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  counterBtnText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  counterBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  adminInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 12,
  },
  generateActionBtn: {
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    marginTop: 4,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  generateActionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  filterBar: {
    marginBottom: 12,
  },
  searchCodesInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    marginBottom: 8,
  },
  statusChipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  statusChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusChipActive: {
    backgroundColor: '#0284C7',
  },
  statusChipText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  statusChipTextActive: {
    color: '#FFFFFF',
  },
  emptyList: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyListText: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 8,
  },
  codeCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  codeCardRevoked: {
    opacity: 0.6,
    backgroundColor: '#FEF2F2',
  },
  codeCardUsed: {
    backgroundColor: '#F0FDF4',
  },
  codeCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  codeBadge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  codeText: {
    color: '#38BDF8',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  codePlanBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  codePlanText: {
    fontSize: 11,
    color: '#0369A1',
    fontWeight: '600',
  },
  codeStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusActive: {
    backgroundColor: '#DCFCE7',
  },
  statusUsed: {
    backgroundColor: '#E0E7FF',
  },
  statusRevoked: {
    backgroundColor: '#FEE2E2',
  },
  codeStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1E293B',
  },
  codeNotes: {
    fontSize: 11,
    color: '#475569',
    marginBottom: 2,
    textAlign: 'right',
  },
  codeDate: {
    fontSize: 10,
    color: '#94A3B8',
    marginBottom: 8,
    textAlign: 'right',
  },
  codeActionsRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  actionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  actionBtnPrimaryText: {
    fontSize: 11,
    color: '#0284C7',
    fontWeight: '600',
  },
  actionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  actionBtnSecondaryText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
  actionBtnDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  actionBtnDangerText: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '600',
  },
  actionBtnTrash: {
    padding: 6,
  },
  recipesControlHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  addNewRecipeBtn: {
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  addNewRecipeBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  recipeAdminCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  recipeAdminTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recipeAdminInfo: {
    flex: 1,
  },
  recipeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    marginBottom: 2,
  },
  recipeAdminTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'right',
  },
  youtubeSmallBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  youtubeSmallBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  recipeAdminTitleEn: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
    textAlign: 'left',
  },
  recipeAdminTagsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  recipeAdminCategory: {
    fontSize: 11,
    color: '#0284C7',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recipeAdminPh: {
    fontSize: 11,
    color: '#475569',
  },
  recipeAdminIngCount: {
    fontSize: 11,
    color: '#475569',
  },
  recipeAdminActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 10,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  recipeActionEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  recipeActionEditText: {
    fontSize: 12,
    color: '#0284C7',
    fontWeight: '600',
  },
  recipeActionDelete: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  recipeActionDeleteText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  restoreDefaultsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 8,
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    gap: 6,
  },
  restoreDefaultsText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  settingToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
    textAlign: 'right',
  },
  settingDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 14,
  },
  deviceStatusBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  deviceStatusTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
    textAlign: 'right',
  },
  deviceStatusCode: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'right',
  },
  deviceActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  deviceInstantBtn: {
    flex: 1,
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  deviceInstantBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  deviceResetBtn: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  deviceResetBtnText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
  },
  securityText: {
    fontSize: 13,
    color: '#334155',
    marginBottom: 4,
    textAlign: 'right',
  },
  secretText: {
    fontWeight: '700',
    color: '#0284C7',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  securitySub: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 16,
    textAlign: 'right',
  },
});
