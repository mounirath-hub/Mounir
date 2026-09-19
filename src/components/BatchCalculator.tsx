import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Ingredient } from '../types';

interface BatchCalculatorProps {
  ingredients: Ingredient[];
}

const PRESET_VOLUMES = [1, 5, 10, 50, 100, 500, 1000];

export const BatchCalculator: React.FC<BatchCalculatorProps> = ({ ingredients }) => {
  const [selectedVolume, setSelectedVolume] = useState<number>(100); // default 100L
  const [customInput, setCustomInput] = useState<string>('100');
  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({});

  const handleSelectVolume = (vol: number) => {
    setSelectedVolume(vol);
    setCustomInput(vol.toString());
  };

  const handleCustomChange = (text: string) => {
    setCustomInput(text);
    const num = parseFloat(text);
    if (!isNaN(num) && num > 0) {
      setSelectedVolume(num);
    }
  };

  const toggleCheck = (idx: number) => {
    setCheckedIngredients(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Format weight nicely (g or kg)
  const formatWeight = (percentage: number, totalVolume: number) => {
    const rawKg = (percentage / 100) * totalVolume;
    if (rawKg < 1) {
      const grams = rawKg * 1000;
      return `${grams.toFixed(1)} جرام`;
    }
    return `${rawKg.toFixed(2)} كغ`;
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Ionicons name="calculator-outline" size={22} color="#0284C7" />
          <Text style={styles.headerTitle}>حاسبة كميات الإنتاج والخلط</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          اختر حجم البرميل أو الخزان لحساب أوزان المواد بدقة بالجرام والكيلوغرام
        </Text>
      </View>

      {/* Preset Volume Buttons */}
      <View style={styles.presetRow}>
        {PRESET_VOLUMES.map(vol => (
          <TouchableOpacity
            key={vol}
            style={[
              styles.presetChip,
              selectedVolume === vol && styles.presetChipActive,
            ]}
            onPress={() => handleSelectVolume(vol)}
          >
            <Text
              style={[
                styles.presetChipText,
                selectedVolume === vol && styles.presetChipTextActive,
              ]}
            >
              {vol >= 1000 ? `${vol / 1000} طن` : `${vol} لتر`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Custom Volume Row */}
      <View style={styles.customRow}>
        <Text style={styles.customLabel}>حجم مخصص:</Text>
        <TextInput
          style={styles.customInput}
          value={customInput}
          onChangeText={handleCustomChange}
          keyboardType="numeric"
          placeholder="أدخل الحجم باللتر"
        />
        <Text style={styles.customUnit}>لتر / كغ</Text>
      </View>

      {/* Ingredients calculated table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.th, { flex: 2, textAlign: 'right' }]}>المادة الكيميائية</Text>
          <Text style={[styles.th, { flex: 1, textAlign: 'center' }]}>النسبة %</Text>
          <Text style={[styles.th, { flex: 1.2, textAlign: 'left' }]}>الوزن المطلوب</Text>
          <Text style={[styles.th, { width: 34, textAlign: 'center' }]}>تم</Text>
        </View>

        {ingredients.map((item, idx) => {
          const isChecked = !!checkedIngredients[idx];
          return (
            <TouchableOpacity
              key={idx}
              style={[
                styles.tableRow,
                idx % 2 === 1 && styles.tableRowAlt,
                isChecked && styles.tableRowChecked,
              ]}
              onPress={() => toggleCheck(idx)}
              activeOpacity={0.7}
            >
              <View style={{ flex: 2, paddingRight: 6 }}>
                <Text style={[styles.matName, isChecked && styles.textChecked]}>
                  {item.name}
                </Text>
                {item.chemicalName ? (
                  <Text style={styles.chemName}>{item.chemicalName}</Text>
                ) : null}
              </View>

              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={styles.percentageBadge}>{item.percentage}%</Text>
              </View>

              <View style={{ flex: 1.2, alignItems: 'flex-start' }}>
                <Text style={[styles.weightText, isChecked && styles.textChecked]}>
                  {formatWeight(item.percentage, selectedVolume)}
                </Text>
              </View>

              <View style={{ width: 34, alignItems: 'center' }}>
                <Ionicons
                  name={isChecked ? 'checkmark-circle' : 'ellipse-outline'}
                  size={20}
                  color={isChecked ? '#10B981' : '#CBD5E1'}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.footerInfo}>
        <Ionicons name="information-circle-outline" size={16} color="#64748B" />
        <Text style={styles.footerText}>
          إجمالي خلطة الإنتاج: <Text style={{ fontWeight: '700' }}>{selectedVolume} لتر</Text> — اضغط على أي سطر لتأشير إضافة المادة في الخزان
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  header: {
    marginBottom: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    textAlign: 'right',
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  presetChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetChipActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  presetChipTextActive: {
    color: '#FFFFFF',
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  customLabel: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 8,
  },
  customInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    paddingVertical: 2,
    textAlign: 'center',
  },
  customUnit: {
    fontSize: 12,
    color: '#64748B',
    marginRight: 8,
  },
  table: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  th: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableRowAlt: {
    backgroundColor: '#FAFAFA',
  },
  tableRowChecked: {
    backgroundColor: '#F0FDF4',
  },
  matName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'right',
  },
  chemName: {
    fontSize: 10,
    color: '#64748B',
    fontStyle: 'italic',
    textAlign: 'right',
    marginTop: 2,
  },
  percentageBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  weightText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  textChecked: {
    color: '#059669',
    textDecorationLine: 'line-through',
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 4,
  },
  footerText: {
    fontSize: 11,
    color: '#64748B',
    flex: 1,
    textAlign: 'right',
  },
});
