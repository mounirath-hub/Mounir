import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { extractYouTubeId, getYouTubeThumbnail, getYouTubeWatchUrl } from '../utils/youtube';

interface YouTubePlayerProps {
  url?: string;
  title?: string;
  subtitle?: string;
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ url, title, subtitle }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  const videoId = extractYouTubeId(url);

  if (!url || !videoId) {
    return (
      <View style={styles.noVideoContainer}>
        <Ionicons name="videocam-outline" size={32} color="#94A3B8" />
        <Text style={styles.noVideoText}>لم يتم إرفاق فيديو توضيحي لهذه الوصفة بعد</Text>
        <Text style={styles.noVideoSub}>يمكن للأدمن إضافة رابط فيديو يوتيوب في أي وقت من لوحة الإدارة</Text>
      </View>
    );
  }

  const thumbnailUrl = getYouTubeThumbnail(videoId);
  const watchUrl = getYouTubeWatchUrl(videoId);

  const handleOpenExternal = () => {
    Linking.openURL(watchUrl).catch(err => {
      console.warn('Could not open YouTube URL:', err);
    });
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <View style={styles.titleInfo}>
          <View style={styles.tagBadge}>
            <Ionicons name="logo-youtube" size={16} color="#EF4444" />
            <Text style={styles.tagBadgeText}>يوتيوب حصري</Text>
          </View>
          <Text style={styles.headerTitle}>{title || 'فيديو طريقة التحضير والمزج المباشر'}</Text>
        </View>

        <TouchableOpacity
          style={styles.externalButton}
          onPress={handleOpenExternal}
          activeOpacity={0.7}
        >
          <Ionicons name="open-outline" size={16} color="#2563EB" />
          <Text style={styles.externalButtonText}>فتح في يوتيوب</Text>
        </TouchableOpacity>
      </View>

      {subtitle && <Text style={styles.subtitleText}>{subtitle}</Text>}

      <View style={styles.playerContainer}>
        {Platform.OS === 'web' ? (
          !isPlaying ? (
            <TouchableOpacity
              style={styles.thumbnailWrapper}
              onPress={() => setIsPlaying(true)}
              activeOpacity={0.9}
            >
              <Image source={{ uri: thumbnailUrl }} style={styles.thumbnailImage} />
              <View style={styles.overlay}>
                <View style={styles.playButton}>
                  <Ionicons name="play" size={32} color="#FFFFFF" style={{ marginLeft: 4 }} />
                </View>
                <Text style={styles.clickToPlayText}>اضغط لتشغيل الفيديو داخل التطبيق</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.webIframeContainer}>
              {/* @ts-ignore - React Native Web supports iframe */}
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                title={title || 'فيديو يوتيوب'}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  borderRadius: 14,
                }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </View>
          )
        ) : (
          // Mobile native (iOS / Android)
          !isPlaying ? (
            <TouchableOpacity
              style={styles.thumbnailWrapper}
              onPress={() => setIsPlaying(true)}
              activeOpacity={0.9}
            >
              <Image source={{ uri: thumbnailUrl }} style={styles.thumbnailImage} />
              <View style={styles.overlay}>
                <View style={styles.playButton}>
                  <Ionicons name="play" size={32} color="#FFFFFF" style={{ marginLeft: 4 }} />
                </View>
                <Text style={styles.clickToPlayText}>اضغط لتشغيل الفيديو مباشرة</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <NativePlayer videoId={videoId} onOpenExternal={handleOpenExternal} />
          )
        )}
      </View>

      <View style={styles.playerFooter}>
        <View style={styles.footerNote}>
          <Ionicons name="shield-checkmark" size={14} color="#10B981" />
          <Text style={styles.footerNoteText}>فيديو تعليمي تم التحقق من خطواته الكيميائية</Text>
        </View>
        {isPlaying && (
          <TouchableOpacity
            style={styles.stopButton}
            onPress={() => setIsPlaying(false)}
          >
            <Ionicons name="pause" size={14} color="#64748B" />
            <Text style={styles.stopButtonText}>إيقاف العرض</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// Sub-component for native devices using WebView if available or fallback
const NativePlayer: React.FC<{ videoId: string; onOpenExternal: () => void }> = ({ videoId, onOpenExternal }) => {
  let WebViewComponent: any = null;
  try {
    WebViewComponent = require('react-native-webview').WebView;
  } catch (e) {
    WebViewComponent = null;
  }

  if (WebViewComponent) {
    return (
      <View style={styles.nativeWebviewContainer}>
        <WebViewComponent
          style={{ flex: 1, backgroundColor: '#000000', borderRadius: 14 }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsFullscreenVideo={true}
          source={{
            uri: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0`,
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.nativeFallback}>
      <Text style={styles.nativeFallbackText}>لتجربة مشاهدة ممتعة ومباشرة على الهاتف:</Text>
      <TouchableOpacity style={styles.nativeWatchButton} onPress={onOpenExternal}>
        <Ionicons name="logo-youtube" size={20} color="#FFFFFF" />
        <Text style={styles.nativeWatchButtonText}>مشاهدة الفيديو على تطبيق يوتيوب</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    padding: 16,
    marginVertical: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  titleInfo: {
    flex: 1,
    paddingRight: 8,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
    gap: 4,
  },
  tagBadgeText: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'right',
  },
  subtitleText: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 12,
    textAlign: 'right',
    lineHeight: 18,
  },
  externalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  externalButtonText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },
  playerContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000000',
    borderRadius: 14,
    overflow: 'hidden',
  },
  webIframeContainer: {
    width: '100%',
    height: '100%',
  },
  nativeWebviewContainer: {
    width: '100%',
    height: '100%',
  },
  thumbnailWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  clickToPlayText: {
    marginTop: 12,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  nativeFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1E293B',
  },
  nativeFallbackText: {
    color: '#E2E8F0',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  nativeWatchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  nativeWatchButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  playerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerNoteText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  stopButtonText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  noVideoContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 20,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noVideoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
  },
  noVideoSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
  },
});
