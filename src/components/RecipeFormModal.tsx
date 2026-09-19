import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Recipe, Ingredient } from '../types';
import { extractYouTubeId } from '../utils/youtube';

interface RecipeFormModalProps {
  visible: boolean;
  recipeToEdit: Recipe | null;
  onClose: () => void;
  onSave: (recipe: Recipe) => void;
}

const PRESET_IMAGES = [
  { label: 'شامبو ورغوة', url: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=800&q=80' },
  { label: 'زجاج ومرايا', url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80' },
  { label: 'إطارات وجنوط', url: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80' },
  { label: 'أواني ومطبخ', url: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=800&q=80' },
  { label: 'أثاث وجلود', url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80' },
  { label: 'محرك وشحوم', url: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80' },
];

export const RecipeFormModal: React.FC<RecipeFormModalProps> = ({
  visible,
  recipeToEdit,
  onClose,
  onSave,
}) => {
  // Form fields
  const [title, setTitle] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [categoryName, setCategoryName] = useState('شامبو ورغوة');
  const [mainSection, setMainSection] = useState<'car_care' | 'household' | 'furniture' | 'industrial'>('car_care');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [badge, setBadge] = useState('');
  const [phLevel, setPhLevel] = useState('6.5 - 7.0');
  const [difficulty, setDifficulty] = useState('متوسط');
  const [preparationTime, setPreparationTime] = useState('30 دقيقة');
  const [usageInstructions, setUsageInstructions] = useState('');

  // Dynamic ingredients
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: 'ماء نقي', chemicalName: 'Aqua (Water)', percentage: 80, role: 'مذيب رئيسي' },
    { name: 'تكسابون 70%', chemicalName: 'SLES 70%', percentage: 12, role: 'رغوة وتنظيف' },
    { name: 'كمبرلان CDE', chemicalName: 'Cocamide DEA', percentage: 3, role: 'مثبت رغوة' },
    { name: 'عطر وملون', chemicalName: 'Fragrance & Color', percentage: 1, role: 'تحسين الرائحة' },
  ]);

  // Dynamic steps
  const [steps, setSteps] = useState<string[]>([
    'ضع الماء النقي في خزان الخلط النظيف.',
    'أضف المواد الفعالة تدريجياً مع التحريك الهادئ.',
    'اضبط درجة الحموضة pH واخلط حتى التجانس التام.',
  ]);

  // Safety & tips
  const [safetyWarnings, setSafetyWarnings] = useState<string[]>([
    'ارتداء القفازات والنظارات الواقية أثناء التعامل مع المواد الخام المركزة.',
  ]);
  const [formulationTips, setFormulationTips] = useState<string[]>([
    'التحريك الهادئ يمنع تشكل الرغوة الزائدة داخل الخزان أثناء التصنيع.',
  ]);

  // New item inputs
  const [newIngName, setNewIngName] = useState('');
  const [newIngChem, setNewIngChem] = useState('');
  const [newIngPercent, setNewIngPercent] = useState('');
  const [newIngRole, setNewIngRole] = useState('');
  const [newStepText, setNewStepText] = useState('');
  const [newWarningText, setNewWarningText] = useState('');
  const [newTipText, setNewTipText] = useState('');

  // Load recipe when editing
  useEffect(() => {
    if (recipeToEdit) {
      setTitle(recipeToEdit.title || '');
      setTitleEn(recipeToEdit.titleEn || '');
      setCategoryName(recipeToEdit.categoryName || 'شامبو ورغوة');
      setMainSection((recipeToEdit.mainSection as any) || 'car_care');
      setYoutubeUrl(recipeToEdit.youtubeUrl || '');
      setImageUrl(recipeToEdit.imageUrl || PRESET_IMAGES[0].url);
      setShortDesc(recipeToEdit.shortDesc || '');
      setBadge(recipeToEdit.badge || '');
      setPhLevel(recipeToEdit.phLevel || '7.0');
      setDifficulty(recipeToEdit.difficulty || 'متوسط');
      setPreparationTime(recipeToEdit.preparationTime || '30 دقيقة');
      setUsageInstructions(recipeToEdit.usageInstructions || '');
      setIngredients(recipeToEdit.ingredients || []);
      setSteps(recipeToEdit.preparationSteps || []);
      setSafetyWarnings(recipeToEdit.safetyWarnings || []);
      setFormulationTips(recipeToEdit.formulationTips || []);
    } else {
      // Default reset
      setTitle('');
      setTitleEn('');
      setCategoryName('شامبو ورغوة');
      setMainSection('car_care');
      setYoutubeUrl('');
      setImageUrl(PRESET_IMAGES[0].url);
      setShortDesc('');
      setBadge('');
      setPhLevel('6.5 - 7.0');
      setDifficulty('متوسط');
      setPreparationTime('30 دقيقة');
      setUsageInstructions('');
      setIngredients([
        { name: 'ماء نقي', chemicalName: 'Aqua', percentage: 80, role: 'مذيب رئيسي' },
        { name: 'تكسابون 70%', chemicalName: 'SLES', percentage: 12, role: 'رغوة وتنظيف' },
      ]);
      setSteps(['ضع الماء في وعاء الخلط.', 'أضف المواد الفعالة وحرك جيداً حتى التجانس.']);
      setSafetyWarnings(['ارتداء قفازات واقية']);
      setFormulationTips(['الخلط باتجاه واحد يمنع فقاعات الهواء']);
    }
  }, [recipeToEdit, visible]);

  // Calculate total percentage
  const totalPercentage = ingredients.reduce((sum, ing) => sum + (Number(ing.percentage) || 0), 0);

  const handleAddIngredient = () => {
    if (!newIngName.trim()) return;
    const perc = parseFloat(newIngPercent) || 1;
    setIngredients([
      ...ingredients,
      {
        name: newIngName.trim(),
        chemicalName: newIngChem.trim() || undefined,
        percentage: perc,
        role: newIngRole.trim() || 'مكون أساسي',
      },
    ]);
    setNewIngName('');
    setNewIngChem('');
    setNewIngPercent('');
    setNewIngRole('');
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleAddStep = () => {
    if (!newStepText.trim()) return;
    setSteps([...steps, newStepText.trim()]);
    setNewStepText('');
  };

  const handleRemoveStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleAddWarning = () => {
    if (!newWarningText.trim()) return;
    setSafetyWarnings([...safetyWarnings, newWarningText.trim()]);
    setNewWarningText('');
  };

  const handleAddTip = () => {
    if (!newTipText.trim()) return;
    setFormulationTips([...formulationTips, newTipText.trim()]);
    setNewTipText('');
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert('يرجى كتابة عنوان الوصفة');
      return;
    }
    if (ingredients.length === 0) {
      alert('يرجى إضافة مكون واحد على الأقل للتركيبة');
      return;
    }

    const mainSectionName =
      mainSection === 'car_care'
        ? 'العناية بالسيارات'
        : mainSection === 'household'
        ? 'المنظفات المنزلية'
        : mainSection === 'furniture'
        ? 'تنظيف الكنب والأثاث'
        : 'المنظفات الصناعية';

    const savedRecipe: Recipe = {
      id: recipeToEdit ? recipeToEdit.id : `formula_${Date.now()}`,
      slug: recipeToEdit?.slug || `recipe-${Date.now()}`,
      title: title.trim(),
      titleEn: titleEn.trim() || undefined,
      category: categoryName.toLowerCase().replace(/\s+/g, '_'),
      categoryName: categoryName.trim(),
      mainSection,
      mainSectionName,
      imageUrl: imageUrl.trim() || PRESET_IMAGES[0].url,
      shortDesc: shortDesc.trim() || 'تركيبة صناعية احترافية بمواصفات عالية الجودة.',
      badge: badge.trim() || 'تركيبة معتمدة',
      phLevel: phLevel.trim() || '7.0',
      difficulty,
      preparationTime,
      youtubeUrl: youtubeUrl.trim() || undefined,
      ingredients,
      preparationSteps: steps.length > 0 ? steps : ['امزج المكونات بترتيب النسب حتى التجانس الكامل.'],
      safetyWarnings: safetyWarnings.length > 0 ? safetyWarnings : ['ارتدِ معدات الوقاية الشخصية أثناء الخلط'],
      formulationTips,
      usageInstructions: usageInstructions.trim() || 'يخفف بالماء حسب درجة الاتساخ أو يستخدم مركزاً.',
      isPremium: true,
      updatedAt: new Date().toISOString(),
    };

    onSave(savedRecipe);
  };

  const detectedVideoId = extractYouTubeId(youtubeUrl);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: '#FFFFFF' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {recipeToEdit ? 'تعديل الوصفة الحالية' : 'إضافة تركيبة كيميائية جديدة'}
          </Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveBtnTop}>
            <Text style={styles.saveBtnTopText}>حفظ</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollBody} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Basic Info */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>معلومات التركيبة الأساسية</Text>

            <Text style={styles.label}>اسم التركيبة / الوصفة (بالعربية): *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="مثال: شامبو غسيل سيارات فائق الرغوة"
              textAlign="right"
            />

            <Text style={styles.label}>الاسم بالإنجليزية (اختياري):</Text>
            <TextInput
              style={styles.input}
              value={titleEn}
              onChangeText={setTitleEn}
              placeholder="e.g. Ultra Foam Car Shampoo"
              textAlign="left"
            />

            <Text style={styles.label}>القسم الرئيسي: *</Text>
            <View style={styles.chipsRow}>
              {[
                { key: 'car_care', label: '🚗 قسم العناية بالسيارات' },
                { key: 'household', label: '🏠 قسم مواد التنظيف المنزلية' },
              ].map((sec) => (
                <TouchableOpacity
                  key={sec.key}
                  style={[styles.chip, mainSection === sec.key && styles.chipActive]}
                  onPress={() => setMainSection(sec.key as any)}
                >
                  <Text style={[styles.chipText, mainSection === sec.key && styles.chipTextActive]}>
                    {sec.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>اسم التصنيف الفرعي:</Text>
            <TextInput
              style={styles.input}
              value={categoryName}
              onChangeText={setCategoryName}
              placeholder="مثال: شامبو ورغوة، إطارات، أواني ومطبخ"
              textAlign="right"
            />

            <Text style={styles.label}>شارة مميزة (Badge):</Text>
            <TextInput
              style={styles.input}
              value={badge}
              onChangeText={setBadge}
              placeholder="مثال: رغوة ثلجية، لمعان فائق، اقتصادي"
              textAlign="right"
            />

            <Text style={styles.label}>الوصف المختصر:</Text>
            <TextInput
              style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
              value={shortDesc}
              onChangeText={setShortDesc}
              multiline
              placeholder="نبذة عن الفعالية والاستخدام والخصائص..."
              textAlign="right"
            />
          </View>

          {/* YouTube Video Section */}
          <View style={[styles.sectionCard, styles.youtubeSection]}>
            <View style={styles.youtubeHeaderRow}>
              <Ionicons name="logo-youtube" size={24} color="#EF4444" />
              <Text style={styles.youtubeSectionTitle}>فيديو يوتيوب للوصفة (تشغيل مباشر)</Text>
            </View>
            <Text style={styles.youtubeHelperText}>
              أدخل رابط فيديو يوتيوب أو معرف الفيديو ليتمكن المستخدم من مشاهدة خطوات التصنيع مباشرة داخل التطبيق
            </Text>

            <TextInput
              style={styles.input}
              value={youtubeUrl}
              onChangeText={setYoutubeUrl}
              placeholder="https://www.youtube.com/watch?v=... أو معرف الفيديو"
              autoCapitalize="none"
              autoCorrect={false}
              textAlign="left"
            />

            {detectedVideoId ? (
              <View style={styles.videoDetectedCard}>
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                <Text style={styles.videoDetectedText}>
                  تم التعرف على الفيديو بنجاح! ID: {detectedVideoId}
                </Text>
              </View>
            ) : youtubeUrl ? (
              <View style={styles.videoErrorCard}>
                <Ionicons name="alert-circle" size={18} color="#EF4444" />
                <Text style={styles.videoErrorText}>الرابط غير صالح، تأكد من كتابة رابط يوتيوب صحيح</Text>
              </View>
            ) : null}
          </View>

          {/* Image Selection */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>صورة التركيبة</Text>
            <Text style={styles.label}>اختر صورة جاهزة سريعة:</Text>
            <View style={styles.chipsRow}>
              {PRESET_IMAGES.map((img, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.chip, imageUrl === img.url && styles.chipActive]}
                  onPress={() => setImageUrl(img.url)}
                >
                  <Text style={[styles.chipText, imageUrl === img.url && styles.chipTextActive]}>
                    {img.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>أو رابط صورة مخصص (URL):</Text>
            <TextInput
              style={styles.input}
              value={imageUrl}
              onChangeText={setImageUrl}
              placeholder="https://images.unsplash.com/..."
              autoCapitalize="none"
              textAlign="left"
            />
          </View>

          {/* Technical Specs */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>المواصفات الفنية للتركيبة</Text>

            <View style={styles.rowTwo}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>درجة الـ pH:</Text>
                <TextInput
                  style={styles.input}
                  value={phLevel}
                  onChangeText={setPhLevel}
                  placeholder="مثال: 6.5 - 7.0"
                  textAlign="center"
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.label}>وقت التحضير:</Text>
                <TextInput
                  style={styles.input}
                  value={preparationTime}
                  onChangeText={setPreparationTime}
                  placeholder="مثال: 25 دقيقة"
                  textAlign="center"
                />
              </View>
            </View>

            <Text style={styles.label}>مستوى الصعوبة:</Text>
            <View style={styles.chipsRow}>
              {['سهل', 'متوسط', 'متقدم / صناعي'].map((diff) => (
                <TouchableOpacity
                  key={diff}
                  style={[styles.chip, difficulty === diff && styles.chipActive]}
                  onPress={() => setDifficulty(diff)}
                >
                  <Text style={[styles.chipText, difficulty === diff && styles.chipTextActive]}>
                    {diff}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Dynamic Ingredients */}
          <View style={styles.sectionCard}>
            <View style={styles.ingredientsHeaderRow}>
              <Text style={styles.sectionHeader}>المكونات والنسب الكيميائية</Text>
              <View
                style={[
                  styles.totalPercentBadge,
                  Math.abs(totalPercentage - 100) < 0.1
                    ? styles.totalOk
                    : styles.totalWarning,
                ]}
              >
                <Text style={styles.totalPercentText}>
                  المجموع: {totalPercentage.toFixed(1)}%
                </Text>
              </View>
            </View>

            {/* Existing ingredients list */}
            {ingredients.map((ing, idx) => (
              <View key={idx} style={styles.ingredientRow}>
                <View style={{ flex: 2 }}>
                  <Text style={styles.ingName}>{ing.name}</Text>
                  {ing.chemicalName && <Text style={styles.ingChem}>{ing.chemicalName}</Text>}
                  <Text style={styles.ingRole}>{ing.role}</Text>
                </View>
                <View style={styles.ingPercBox}>
                  <Text style={styles.ingPercText}>{ing.percentage}%</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleRemoveIngredient(idx)}
                  style={styles.removeBtn}
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}

            {/* Add new ingredient */}
            <View style={styles.addIngredientBox}>
              <Text style={styles.addIngTitle}>+ إضافة مادة جديدة للخلطة:</Text>
              <TextInput
                style={styles.inputSmall}
                value={newIngName}
                onChangeText={setNewIngName}
                placeholder="اسم المادة (مثال: تكسابون 70%)"
                textAlign="right"
              />
              <TextInput
                style={styles.inputSmall}
                value={newIngChem}
                onChangeText={setNewIngChem}
                placeholder="الاسم الكيميائي اللاتيني (اختياري)"
                textAlign="left"
              />
              <View style={styles.rowTwo}>
                <TextInput
                  style={[styles.inputSmall, { flex: 1 }]}
                  value={newIngPercent}
                  onChangeText={setNewIngPercent}
                  placeholder="النسبة % (مثال: 12)"
                  keyboardType="numeric"
                  textAlign="center"
                />
                <TextInput
                  style={[styles.inputSmall, { flex: 2 }]}
                  value={newIngRole}
                  onChangeText={setNewIngRole}
                  placeholder="الوظيفة (رغوة، مذيب، مغلظ)"
                  textAlign="right"
                />
              </View>
              <TouchableOpacity style={styles.addIngBtn} onPress={handleAddIngredient}>
                <Ionicons name="add-circle" size={18} color="#FFFFFF" />
                <Text style={styles.addIngBtnText}>إضافة المادة للتركيبة</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Preparation Steps */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>خطوات التحضير والمزج</Text>

            {steps.map((st, idx) => (
              <View key={idx} style={styles.stepRow}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumberText}>{idx + 1}</Text>
                </View>
                <Text style={styles.stepText}>{st}</Text>
                <TouchableOpacity onPress={() => handleRemoveStep(idx)} style={styles.removeBtn}>
                  <Ionicons name="close-circle" size={18} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.addStepRow}>
              <TextInput
                style={[styles.inputSmall, { flex: 1 }]}
                value={newStepText}
                onChangeText={setNewStepText}
                placeholder="اكتب خطوة جديدة ثم اضغط إضافة..."
                textAlign="right"
              />
              <TouchableOpacity style={styles.addStepBtn} onPress={handleAddStep}>
                <Text style={styles.addStepBtnText}>إضافة خطوة</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Safety & Instructions */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>إرشادات الاستخدام والسلامة</Text>

            <Text style={styles.label}>طريقة الاستخدام والتخفيف:</Text>
            <TextInput
              style={[styles.input, { height: 60 }]}
              value={usageInstructions}
              onChangeText={setUsageInstructions}
              multiline
              placeholder="مثال: يخفف 1:10 بالماء للغسيل العادي أو يستخدم مركزاً للدهون..."
              textAlign="right"
            />

            <Text style={styles.label}>تحذيرات السلامة:</Text>
            {safetyWarnings.map((w, idx) => (
              <Text key={idx} style={styles.bulletItem}>• {w}</Text>
            ))}
            <View style={styles.addStepRow}>
              <TextInput
                style={[styles.inputSmall, { flex: 1 }]}
                value={newWarningText}
                onChangeText={setNewWarningText}
                placeholder="تحذير سلامة جديد..."
                textAlign="right"
              />
              <TouchableOpacity style={styles.addStepBtn} onPress={handleAddWarning}>
                <Text style={styles.addStepBtnText}>إضافة</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>أسرار التركيبة (Tips):</Text>
            {formulationTips.map((t, idx) => (
              <Text key={idx} style={styles.bulletItem}>★ {t}</Text>
            ))}
            <View style={styles.addStepRow}>
              <TextInput
                style={[styles.inputSmall, { flex: 1 }]}
                value={newTipText}
                onChangeText={setNewTipText}
                placeholder="نصيحة تصنيعية جديدة..."
                textAlign="right"
              />
              <TouchableOpacity style={styles.addStepBtn} onPress={handleAddTip}>
                <Text style={styles.addStepBtnText}>إضافة</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom Save Button */}
          <TouchableOpacity style={styles.bigSaveBtn} onPress={handleSave} activeOpacity={0.85}>
            <Ionicons name="save" size={20} color="#FFFFFF" />
            <Text style={styles.bigSaveBtnText}>
              {recipeToEdit ? 'حفظ التعديلات على الوصفة' : 'نشر الوصفة الجديدة'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 6,
  },
  saveBtnTop: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  saveBtnTopText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  scrollBody: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
    textAlign: 'right',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
    marginTop: 8,
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 6,
  },
  inputSmall: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  chipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  youtubeSection: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FFF5F5',
  },
  youtubeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  youtubeSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#991B1B',
  },
  youtubeHelperText: {
    fontSize: 12,
    color: '#7F1D1D',
    marginBottom: 10,
    lineHeight: 18,
    textAlign: 'right',
  },
  videoDetectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: 8,
    borderRadius: 8,
    gap: 6,
    marginTop: 6,
  },
  videoDetectedText: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '600',
  },
  videoErrorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 8,
    borderRadius: 8,
    gap: 6,
    marginTop: 6,
  },
  videoErrorText: {
    fontSize: 12,
    color: '#DC2626',
  },
  rowTwo: {
    flexDirection: 'row',
    gap: 10,
  },
  ingredientsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  totalPercentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  totalOk: {
    backgroundColor: '#DCFCE7',
  },
  totalWarning: {
    backgroundColor: '#FEF3C7',
  },
  totalPercentText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ingName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'right',
  },
  ingChem: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
    textAlign: 'right',
  },
  ingRole: {
    fontSize: 10,
    color: '#0284C7',
    textAlign: 'right',
  },
  ingPercBox: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginHorizontal: 8,
  },
  ingPercText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7',
  },
  removeBtn: {
    padding: 4,
  },
  addIngredientBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  addIngTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
    textAlign: 'right',
  },
  addIngBtn: {
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 8,
    gap: 6,
    marginTop: 4,
  },
  addIngBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    marginBottom: 6,
    gap: 8,
  },
  stepNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
    textAlign: 'right',
    lineHeight: 18,
  },
  addStepRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  addStepBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addStepBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  bulletItem: {
    fontSize: 12,
    color: '#334155',
    marginBottom: 4,
    textAlign: 'right',
  },
  bigSaveBtn: {
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    marginVertical: 14,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  bigSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
