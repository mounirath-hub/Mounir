import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SubscriptionState } from '../types';
import { activateUserSubscription, clearUserSubscription } from '../utils/storage';

interface UserActivationModalProps {
  visible: boolean;
  onClose: () => void;
  subscription: SubscriptionState;
  onSubscriptionUpdated: (newSub: SubscriptionState) => void;
}

export const UserActivationModal: React.FC<UserActivationModalProps> = ({
  visible,
  onClose,
  subscription,
  onSubscriptionUpdated,
}) => {
  const [code, setCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleActivate = async (inputCode?: string) => {
    const codeToUse = (inputCode || code).trim().toUpperCase();
    if (!codeToUse) {
      setErrorMessage('يرجى إدخال كود التفعيل المكون من 8 خانات');
      return;
    }
    if (codeToUse.length !== 8) {
      setErrorMessage('كود التفعيل يتكون من 8 أحرف وأرقام بالضبط');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await activateUserSubscription(codeToUse);
      if (res.success && res.sub) {
        setSuccessMessage(res.message);
        setCode('');
        onSubscriptionUpdated(res.sub);
        setTimeout(() => {
          onClose();
        }, 1600);
      } else {
        setErrorMessage(res.message);
      }
    } catch (err) {
      setErrorMessage('حدث خطأ أثناء التحقق من الكود، حاول مجدداً');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    await clearUserSubscription();
    onSubscriptionUpdated({
      isSubscribed: false,
      activeCode: null,
      planName: null,
      expiresAt: null,
      isLifetime: false,
      activatedAt: null,
    });
    setSuccessMessage('تم إلغاء تفعيل الاشتراك الحالي على هذا الجهاز');
  };

  const fillQuickCode = (quickCode: string) => {
    setCode(quickCode);
    setErrorMessage(null);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Ionicons name="key" size={24} color="#0284C7" />
              <Text style={styles.modalTitle}>تفعيل اشتراك المستخدم</Text>
            </View>
            <View style={{ width: 32 }} />
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Status Card */}
            {subscription.isSubscribed ? (
              <View style={styles.activeSubCard}>
                <View style={styles.activeSubHeader}>
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                  <Text style={styles.activeSubTitle}>اشتراكك مفعل حالياً!</Text>
                </View>
                <Text style={styles.activeSubPlan}>الخطة: {subscription.planName || 'وصول شامل'}</Text>
                <Text style={styles.activeSubCode}>الكود المستخدم: {subscription.activeCode}</Text>
                {subscription.isLifetime ? (
                  <Text style={styles.activeSubExpiry}>الصلاحية: وصول دائم مدى الحياة (VIP)</Text>
                ) : subscription.expiresAt ? (
                  <Text style={styles.activeSubExpiry}>
                    صالح حتى: {new Date(subscription.expiresAt).toLocaleDateString('ar-EG')}
                  </Text>
                ) : null}
                <TouchableOpacity style={styles.cancelSubBtn} onPress={handleDeactivate}>
                  <Text style={styles.cancelSubText}>إلغاء الاشتراك من هذا الجهاز</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.introCard}>
                <Ionicons name="lock-closed" size={32} color="#0284C7" />
                <Text style={styles.introTitle}>الوصول لكافة التركيبات الاحترافية</Text>
                <Text style={styles.introDesc}>
                  أدخل كود التفعيل المكون من 8 خانات (حروف لاتينية وأرقام) للحصول على الصلاحية الكاملة لتصفح الوصفات، تشغيل فيديوهات يوتيوب، واستخدام حاسبة الأطنان والكميات.
                </Text>
              </View>
            )}

            {/* Input Section */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>أدخل كود الاشتراك (8 خانات):</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="مثال: K9X2M7P4"
                  placeholderTextColor="#94A3B8"
                  value={code}
                  onChangeText={(val) => {
                    setCode(val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8));
                    setErrorMessage(null);
                  }}
                  maxLength={8}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
                <View style={styles.charCounter}>
                  <Text style={[styles.charCounterText, code.length === 8 && styles.charCounterDone]}>
                    {code.length}/8
                  </Text>
                </View>
              </View>

              {/* Character boxes preview */}
              <View style={styles.codeBoxesRow}>
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <View
                    key={i}
                    style={[
                      styles.codeBox,
                      code[i] ? styles.codeBoxFilled : null,
                      code.length === i ? styles.codeBoxActive : null,
                    ]}
                  >
                    <Text style={styles.codeBoxText}>{code[i] || '•'}</Text>
                  </View>
                ))}
              </View>

              {errorMessage && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={18} color="#EF4444" />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}

              {successMessage && (
                <View style={styles.successBox}>
                  <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                  <Text style={styles.successText}>{successMessage}</Text>
                </View>
              )}

              {/* Action Button */}
              <TouchableOpacity
                style={[styles.activateBtn, code.length !== 8 && styles.activateBtnDisabled]}
                onPress={() => handleActivate()}
                disabled={loading || code.length !== 8}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                    <Text style={styles.activateBtnText}>تفعيل الكود الآن</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Quick Demo Codes for Testing */}
            <View style={styles.demoSection}>
              <View style={styles.demoHeader}>
                <Ionicons name="flash-outline" size={16} color="#D97706" />
                <Text style={styles.demoTitle}>أكواد تجريبية جاهزة للاختبار الفوري:</Text>
              </View>
              <View style={styles.demoChips}>
                {[
                  { label: 'VIP مدى الحياة', code: 'VIP88888' },
                  { label: 'سنة كاملة', code: 'CHEM2026' },
                  { label: 'شهر كامل', code: 'K9X2M7P4' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.code}
                    style={styles.demoChip}
                    onPress={() => fillQuickCode(item.code)}
                  >
                    <Text style={styles.demoChipCode}>{item.code}</Text>
                    <Text style={styles.demoChipLabel}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Note about admin generator */}
            <View style={styles.hintSection}>
              <Ionicons name="information-circle-outline" size={16} color="#64748B" />
              <Text style={styles.hintText}>
                يمكن لمدير النظام (الأدمن) توليد أكواد اشتراك جديدة تتكون من 8 حروف لاتينية وأرقام من خلال واجهة الأدمن المخفية.
              </Text>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  scrollBody: {
    padding: 20,
  },
  introCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  introTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0369A1',
    marginTop: 8,
    textAlign: 'center',
  },
  introDesc: {
    fontSize: 13,
    color: '#0C4A6E',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  activeSubCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  activeSubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  activeSubTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065F46',
  },
  activeSubPlan: {
    fontSize: 14,
    color: '#047857',
    fontWeight: '600',
    marginBottom: 4,
  },
  activeSubCode: {
    fontSize: 13,
    color: '#065F46',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  activeSubExpiry: {
    fontSize: 12,
    color: '#059669',
    marginBottom: 10,
  },
  cancelSubBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cancelSubText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
    textAlign: 'right',
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 4,
    textAlign: 'center',
    color: '#0F172A',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  charCounter: {
    position: 'absolute',
    left: 14,
    top: 16,
  },
  charCounterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  charCounterDone: {
    color: '#10B981',
  },
  codeBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 6,
  },
  codeBox: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeBoxFilled: {
    backgroundColor: '#E0F2FE',
    borderColor: '#0284C7',
  },
  codeBoxActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
  },
  codeBoxText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    flex: 1,
    textAlign: 'right',
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    gap: 8,
  },
  successText: {
    fontSize: 13,
    color: '#059669',
    flex: 1,
    textAlign: 'right',
  },
  activateBtn: {
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  activateBtnDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  activateBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  demoSection: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  demoChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  demoChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  demoChipCode: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  demoChipLabel: {
    fontSize: 10,
    color: '#78350F',
    marginTop: 2,
  },
  hintSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 20,
  },
  hintText: {
    fontSize: 11,
    color: '#64748B',
    flex: 1,
    lineHeight: 16,
    textAlign: 'right',
  },
});
