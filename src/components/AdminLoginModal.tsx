import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ADMIN_SECRET_KEY } from '../utils/codeGenerator';

interface AdminLoginModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleLogin = () => {
    if (!password) {
      setError('يرجى إدخال الرقم السري للأدمن');
      return;
    }

    setLoading(true);
    setError(null);

    setTimeout(() => {
      if (password === ADMIN_SECRET_KEY) {
        setLoading(false);
        setPassword('');
        setError(null);
        onSuccess();
      } else {
        setLoading(false);
        setError('الرقم السري غير صحيح! يرجى إدخال الرقم السري المخصص للإدارة');
      }
    }, 400);
  };

  const handleQuickFill = () => {
    setPassword(ADMIN_SECRET_KEY);
    setError(null);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#94A3B8" />
            </TouchableOpacity>
            <View style={styles.iconCircle}>
              <Ionicons name="shield-checkmark" size={28} color="#0284C7" />
            </View>
            <View style={{ width: 32 }} />
          </View>

          <Text style={styles.title}>بوابة مدير النظام (Admin)</Text>
          <Text style={styles.subtitle}>
            الواجهة المخفية للتحكم بالاشتراكات، إدارة وتعديل الوصفات، وتوليد أكواد المواد
          </Text>

          {/* Input */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>الرقم السري للأدمن:</Text>
            <View style={styles.inputRow}>
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#64748B"
                />
              </TouchableOpacity>
              <TextInput
                style={styles.input}
                placeholder="أدخل الرقم السري..."
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={(val) => {
                  setPassword(val);
                  setError(null);
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                onSubmitEditing={handleLogin}
              />
              <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" style={{ marginRight: 10 }} />
            </View>
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#DC2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Quick Password Fill Helper for Convenience */}
          <TouchableOpacity style={styles.hintBox} onPress={handleQuickFill} activeOpacity={0.7}>
            <Ionicons name="key-outline" size={16} color="#0284C7" />
            <Text style={styles.hintText}>
              الرقم السري المحدد: <Text style={styles.hintCode}>{ADMIN_SECRET_KEY}</Text> (اضغط للتعويض التلقائي)
            </Text>
          </TouchableOpacity>

          {/* Submit */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="log-in-outline" size={20} color="#FFFFFF" />
                <Text style={styles.submitBtnText}>دخول لوحة التحكم</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 19,
  },
  inputWrapper: {
    width: '100%',
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    textAlign: 'right',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0F172A',
    textAlign: 'right',
  },
  eyeBtn: {
    padding: 8,
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
    width: '100%',
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    flex: 1,
    textAlign: 'right',
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 10,
    padding: 10,
    marginBottom: 18,
    width: '100%',
    gap: 8,
  },
  hintText: {
    fontSize: 12,
    color: '#0369A1',
    flex: 1,
    textAlign: 'right',
  },
  hintCode: {
    fontWeight: '700',
    color: '#0284C7',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  submitBtn: {
    width: '100%',
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
