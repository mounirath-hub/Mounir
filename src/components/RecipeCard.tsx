import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Recipe } from '../types';
import { extractYouTubeId } from '../utils/youtube';

interface RecipeCardProps {
  recipe: Recipe;
  isLocked: boolean;
  onPress: () => void;
  onLockedPress: () => void;
  onEditPress?: () => void;
  isAdmin?: boolean;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  isLocked,
  onPress,
  onLockedPress,
  onEditPress,
  isAdmin,
}) => {
  const hasYouTube = Boolean(extractYouTubeId(recipe.youtubeUrl));

  const handlePress = () => {
    if (isLocked && !isAdmin) {
      onLockedPress();
    } else {
      onPress();
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, isLocked && styles.cardLocked]}
      onPress={handlePress}
      activeOpacity={0.85}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: recipe.imageUrl || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80' }}
          style={styles.image}
        />

        {/* Top Badges */}
        <View style={styles.topBadgesRow}>
          {hasYouTube && (
            <View style={styles.youtubeBadge}>
              <Ionicons name="logo-youtube" size={13} color="#FFFFFF" />
              <Text style={styles.youtubeBadgeText}>فيديو</Text>
            </View>
          )}

          {recipe.badge ? (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{recipe.badge}</Text>
            </View>
          ) : (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{recipe.categoryName}</Text>
            </View>
          )}
        </View>

        {/* Lock Overlay if locked */}
        {isLocked && !isAdmin && (
          <View style={styles.lockOverlay}>
            <View style={styles.lockIconCircle}>
              <Ionicons name="lock-closed" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.lockText}>يتطلب كود تفعيل</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {recipe.title}
          </Text>
        </View>

        {recipe.titleEn ? (
          <Text style={styles.titleEn} numberOfLines={1}>
            {recipe.titleEn}
          </Text>
        ) : null}

        <Text style={styles.desc} numberOfLines={2}>
          {recipe.shortDesc}
        </Text>

        <View style={styles.metaRow}>
          {/* pH Indicator */}
          {recipe.phLevel ? (
            <View style={styles.phBadge}>
              <Ionicons name="flask-outline" size={12} color="#0284C7" />
              <Text style={styles.phText}>{recipe.phLevel}</Text>
            </View>
          ) : null}

          {/* Ingredients Count */}
          <View style={styles.ingBadge}>
            <Ionicons name="layers-outline" size={12} color="#64748B" />
            <Text style={styles.ingText}>{recipe.ingredients.length} مواد</Text>
          </View>

          {/* Difficulty */}
          {recipe.difficulty ? (
            <View style={styles.diffBadge}>
              <Text style={styles.diffText}>{recipe.difficulty}</Text>
            </View>
          ) : null}
        </View>

        {/* Admin Quick Action Button */}
        {isAdmin && onEditPress && (
          <TouchableOpacity
            style={styles.adminEditBtn}
            onPress={(e) => {
              // @ts-ignore
              e.stopPropagation && e.stopPropagation();
              onEditPress();
            }}
          >
            <Ionicons name="create-outline" size={14} color="#0284C7" />
            <Text style={styles.adminEditText}>تعديل كأدمن</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardLocked: {
    borderColor: '#CBD5E1',
  },
  imageContainer: {
    width: '100%',
    height: 150,
    position: 'relative',
    backgroundColor: '#0F172A',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  topBadgesRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  youtubeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  youtubeBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  categoryBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 'auto',
  },
  categoryBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  lockText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  content: {
    padding: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'right',
    flex: 1,
  },
  titleEn: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'left',
    marginBottom: 6,
    fontWeight: '500',
  },
  desc: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'right',
    lineHeight: 18,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    flexWrap: 'wrap',
  },
  phBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  phText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0369A1',
  },
  ingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ingText: {
    fontSize: 11,
    color: '#475569',
  },
  diffBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  diffText: {
    fontSize: 11,
    color: '#475569',
  },
  adminEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingVertical: 6,
    marginTop: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  adminEditText: {
    fontSize: 12,
    color: '#1D4ED8',
    fontWeight: '600',
  },
});
