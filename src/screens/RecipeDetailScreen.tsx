import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Share,
  Platform,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Recipe } from '../types';
import { YouTubePlayer } from '../components/YouTubePlayer';
import { BatchCalculator } from '../components/BatchCalculator';
import { extractYouTubeId } from '../utils/youtube';

interface RecipeDetailScreenProps {
  recipe: Recipe;
  onBack: () => void;
  isAdmin?: boolean;
  onEditRecipe?: (recipe: Recipe) => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export const RecipeDetailScreen: React.FC<RecipeDetailScreenProps> = ({
  recipe,
  onBack,
  isAdmin,
  onEditRecipe,
  isFavorite,
  onToggleFavorite,
}) => {
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  const toggleStep = (idx: number) => {
    setCompletedSteps(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleShare = async () => {
    try {
      const message = `تركيبة كيميائية صناعية: ${recipe.title}\nالقسم: ${recipe.mainSectionName}\nدرجة الـ pH: ${recipe.phLevel || '7.0'}\nتصفح التركيبة وطريقة التحضير مع الفيديو المباشر عبر تطبيق تركيبات المنظفات!`;
      await Share.share({ message });
    } catch (e) {
      console.warn(e);
    }
  };

  const hasYouTube = Boolean(extractYouTubeId(recipe.youtubeUrl));

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
          <Ionicons name="arrow-forward" size={22} color="#0F172A" />
        </TouchableOpacity>

        <Text style={styles.topBarTitle} numberOfLines={1}>
          {recipe.title}
        </Text>

        <View style={styles.topBarActions}>
          {onToggleFavorite && (
            <TouchableOpacity onPress={onToggleFavorite} style={styles.iconBtn}>
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={22}
                color={isFavorite ? '#EF4444' : '#64748B'}
              />
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={handleShare} style={styles.iconBtn}>
            <Ionicons name="share-social-outline" size={22} color="#64748B" />
          </TouchableOpacity>

          {isAdmin && onEditRecipe && (
            <TouchableOpacity
              onPress={() => onEditRecipe(recipe)}
              style={styles.adminEditHeaderBtn}
            >
              <Ionicons name="create-outline" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: recipe.imageUrl || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80' }}
            style={styles.heroImage}
          />
          <View style={styles.heroOverlay}>
            <View style={styles.heroBadgeRow}>
              <View style={styles.heroCategoryBadge}>
                <Text style={styles.heroCategoryText}>{recipe.categoryName}</Text>
              </View>
              {recipe.badge ? (
                <View style={styles.heroFeatureBadge}>
                  <Text style={styles.heroFeatureText}>{recipe.badge}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* Title and Description */}
        <View style={styles.infoCard}>
          <Text style={styles.mainTitle}>{recipe.title}</Text>
          {recipe.titleEn ? (
            <Text style={styles.subTitleEn}>{recipe.titleEn}</Text>
          ) : null}

          <Text style={styles.descriptionText}>{recipe.shortDesc}</Text>

          {/* Quick Metrics Row */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Ionicons name="flask-outline" size={20} color="#0284C7" />
              <Text style={styles.metricLabel}>درجة الـ pH</Text>
              <Text style={styles.metricValue}>{recipe.phLevel || '6.5 - 7.5'}</Text>
            </View>

            <View style={styles.metricItem}>
              <Ionicons name="time-outline" size={20} color="#D97706" />
              <Text style={styles.metricLabel}>وقت التحضير</Text>
              <Text style={styles.metricValue}>{recipe.preparationTime || '30 دقيقة'}</Text>
            </View>

            <View style={styles.metricItem}>
              <Ionicons name="speedometer-outline" size={20} color="#059669" />
              <Text style={styles.metricLabel}>مستوى الصعوبة</Text>
              <Text style={styles.metricValue}>{recipe.difficulty || 'متوسط'}</Text>
            </View>

            <View style={styles.metricItem}>
              <Ionicons name="layers-outline" size={20} color="#6366F1" />
              <Text style={styles.metricLabel}>عدد المكونات</Text>
              <Text style={styles.metricValue}>{recipe.ingredients.length} مواد</Text>
            </View>
          </View>
        </View>

        {/* ================= IN-APP YOUTUBE PLAYER ================= */}
        <View style={styles.sectionWrapper}>
          <YouTubePlayer
            url={recipe.youtubeUrl}
            title={`فيديو تحضير: ${recipe.title}`}
            subtitle="شاهد خطوات التصنيع والخلط وملاحظات الكيميائي عملياً بالفيديو مباشرة داخل التطبيق"
          />

          {!hasYouTube && isAdmin && onEditRecipe && (
            <TouchableOpacity
              style={styles.addVideoPromptBtn}
              onPress={() => onEditRecipe(recipe)}
            >
              <Ionicons name="logo-youtube" size={18} color="#EF4444" />
              <Text style={styles.addVideoPromptText}>
                أنت في وضع الأدمن: اضغط هنا لإضافة رابط فيديو يوتيوب لهذه التركيبة
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ================= BATCH SIZE CALCULATOR ================= */}
        <View style={styles.sectionWrapper}>
          <BatchCalculator ingredients={recipe.ingredients} />
        </View>

        {/* ================= STEP-BY-STEP PREPARATION ================= */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="construct-outline" size={22} color="#0284C7" />
            <Text style={styles.cardHeaderTitle}>طريقة التحضير وبروتوكول المزج</Text>
          </View>
          <Text style={styles.cardHeaderSub}>
            اتبع خطوات التحضير بالترتيب المحدد لضمان ثبات القوام والشفافية وعدم حدوث انفصال في التركيبة
          </Text>

          <View style={styles.stepsList}>
            {recipe.preparationSteps.map((step, idx) => {
              const isDone = !!completedSteps[idx];
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.stepItem, isDone && styles.stepItemDone]}
                  onPress={() => toggleStep(idx)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.stepNumberBadge, isDone && styles.stepNumberBadgeDone]}>
                    {isDone ? (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    ) : (
                      <Text style={styles.stepNumberText}>{idx + 1}</Text>
                    )}
                  </View>
                  <Text style={[styles.stepItemText, isDone && styles.stepItemTextDone]}>
                    {step}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ================= SAFETY & PPE ================= */}
        {recipe.safetyWarnings && recipe.safetyWarnings.length > 0 && (
          <View style={[styles.sectionCard, styles.safetyCard]}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="warning-outline" size={22} color="#DC2626" />
              <Text style={[styles.cardHeaderTitle, { color: '#B91C1C' }]}>
                تحذيرات السلامة والوقاية الشخصية (PPE)
              </Text>
            </View>

            <View style={styles.ppeRow}>
              <View style={styles.ppeChip}>
                <Ionicons name="hand-left-outline" size={14} color="#DC2626" />
                <Text style={styles.ppeChipText}>قفازات كيميائية</Text>
              </View>
              <View style={styles.ppeChip}>
                <Ionicons name="glasses-outline" size={14} color="#DC2626" />
                <Text style={styles.ppeChipText}>نظارات حماية</Text>
              </View>
              <View style={styles.ppeChip}>
                <Ionicons name="leaf-outline" size={14} color="#DC2626" />
                <Text style={styles.ppeChipText}>تهوية جيدة</Text>
              </View>
            </View>

            {recipe.safetyWarnings.map((warn, idx) => (
              <View key={idx} style={styles.bulletRow}>
                <Ionicons name="alert-circle" size={16} color="#DC2626" style={{ marginTop: 2 }} />
                <Text style={styles.warningBulletText}>{warn}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ================= FORMULATION TIPS ================= */}
        {recipe.formulationTips && recipe.formulationTips.length > 0 && (
          <View style={[styles.sectionCard, styles.tipsCard]}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="bulb-outline" size={22} color="#D97706" />
              <Text style={[styles.cardHeaderTitle, { color: '#B45309' }]}>
                أسرار التركيبة وجودة التصنيع (Pro Tips)
              </Text>
            </View>

            {recipe.formulationTips.map((tip, idx) => (
              <View key={idx} style={styles.bulletRow}>
                <Ionicons name="sparkles" size={16} color="#D97706" style={{ marginTop: 2 }} />
                <Text style={styles.tipBulletText}>{tip}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ================= USAGE INSTRUCTIONS ================= */}
        {recipe.usageInstructions && (
          <View style={styles.sectionCard}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="water-outline" size={22} color="#0284C7" />
              <Text style={styles.cardHeaderTitle}>طريقة الاستخدام والتخفيف</Text>
            </View>
            <Text style={styles.usageText}>{recipe.usageInstructions}</Text>
          </View>
        )}

        {/* Admin Quick Edit Floating Button */}
        {isAdmin && onEditRecipe && (
          <TouchableOpacity
            style={styles.adminEditSticky}
            onPress={() => onEditRecipe(recipe)}
            activeOpacity={0.85}
          >
            <Ionicons name="create" size={20} color="#FFFFFF" />
            <Text style={styles.adminEditStickyText}>تعديل هذه الوصفة في لوحة الإدارة</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topBar: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  topBarTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    padding: 6,
    borderRadius: 8,
  },
  adminEditHeaderBtn: {
    backgroundColor: '#0284C7',
    padding: 6,
    borderRadius: 8,
  },
  scrollContent: {
    flex: 1,
  },
  heroContainer: {
    width: '100%',
    height: 220,
    position: 'relative',
    backgroundColor: '#0F172A',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  heroCategoryBadge: {
    backgroundColor: 'rgba(2, 132, 199, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  heroCategoryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  heroFeatureBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  heroFeatureText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'right',
    marginBottom: 4,
  },
  subTitleEn: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'left',
    marginBottom: 12,
    fontWeight: '500',
  },
  descriptionText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
    textAlign: 'right',
    marginBottom: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 2,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  sectionWrapper: {
    paddingHorizontal: 14,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginHorizontal: 14,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'right',
  },
  cardHeaderSub: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    textAlign: 'right',
    marginBottom: 14,
  },
  stepsList: {
    gap: 10,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepItemDone: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  stepNumberBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  stepNumberBadgeDone: {
    backgroundColor: '#10B981',
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  stepItemText: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
    lineHeight: 20,
    textAlign: 'right',
  },
  stepItemTextDone: {
    color: '#047857',
    textDecorationLine: 'line-through',
  },
  safetyCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  ppeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  ppeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  ppeChipText: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '600',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  warningBulletText: {
    flex: 1,
    fontSize: 12,
    color: '#991B1B',
    lineHeight: 18,
    textAlign: 'right',
  },
  tipsCard: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  tipBulletText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 18,
    textAlign: 'right',
  },
  usageText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
    textAlign: 'right',
  },
  addVideoPromptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
    gap: 8,
  },
  addVideoPromptText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  adminEditSticky: {
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    marginHorizontal: 14,
    marginVertical: 16,
    gap: 8,
  },
  adminEditStickyText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
