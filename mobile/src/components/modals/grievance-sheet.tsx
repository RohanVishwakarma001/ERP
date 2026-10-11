import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { COMPLAINT_CATEGORIES, useCreateComplaint, type ComplaintCategory } from '@/features/campus';
import { Button } from '@/components/ui/primitives';
import { getErrorMessage } from '@/lib/api/api-error';
import { Colors, MinTouchTarget, Radius, Spacing, Type } from '@/constants/theme';

const C = Colors.light;

const CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  ACADEMIC: 'Academic',
  HOSTEL: 'Hostel',
  TRANSPORT: 'Transport',
  INFRASTRUCTURE: 'Infrastructure',
  FINANCE: 'Fees & finance',
  RAGGING: 'Ragging',
};

/** Native form for POST /complaints (student grievance). */
export function GrievanceSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const create = useCreateComplaint();
  const [category, setCategory] = useState<ComplaintCategory | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setCategory(null);
    setTitle('');
    setDescription('');
    setError(null);
    create.reset();
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = () => {
    if (!category) return setError('Choose a category.');
    if (title.trim().length < 5) return setError('Give the issue a short title (at least 5 characters).');
    if (description.trim().length < 10) return setError('Describe the issue in a little more detail.');
    setError(null);
    create.mutate(
      // Ragging reports are always escalated as urgent.
      { category, title: title.trim(), description: description.trim(), priority: category === 'RAGGING' ? 'URGENT' : undefined },
      {
        onSuccess: (ticket) => {
          close();
          Alert.alert('Grievance submitted', `Your ticket number is ${ticket.ticketNumber}. You can track it with the Student Welfare Cell.`);
        },
        onError: (err) => setError(getErrorMessage(err)),
      },
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityRole="button" accessibilityLabel="Cancel grievance" />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]} accessibilityViewIsModal>
          <View style={styles.grabber} />
          <View style={styles.header}>
            <Text style={styles.title} accessibilityRole="header">
              Raise a grievance
            </Text>
            <Pressable onPress={close} style={styles.close} accessibilityRole="button" accessibilityLabel="Close" hitSlop={6}>
              <X size={22} color={C.textSecondary} />
            </Pressable>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: Spacing.lg, paddingBottom: Spacing.lg }}>
            {error && (
              <Text style={styles.error} accessibilityLiveRegion="polite" accessibilityRole="alert">
                {error}
              </Text>
            )}

            <View>
              <Text style={styles.label}>Category</Text>
              <View style={styles.chips} accessibilityRole="radiogroup">
                {COMPLAINT_CATEGORIES.map((c) => {
                  const selected = category === c;
                  return (
                    <Pressable
                      key={c}
                      onPress={() => setCategory(c)}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                      style={[styles.chip, selected && styles.chipSelected]}
                    >
                      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{CATEGORY_LABELS[c]}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {category === 'RAGGING' && (
                <Text style={styles.hint}>Ragging reports are marked urgent and sent to the anti-ragging committee.</Text>
              )}
            </View>

            <View>
              <Text style={styles.label} nativeID="grievance-title">
                Title
              </Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                maxLength={200}
                placeholder="e.g. Projector not working in LH-302"
                placeholderTextColor={C.textMuted}
                accessibilityLabelledBy="grievance-title"
                accessibilityLabel="Title"
                style={styles.input}
                returnKeyType="next"
              />
            </View>

            <View>
              <Text style={styles.label} nativeID="grievance-desc">
                Details
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                maxLength={5000}
                multiline
                textAlignVertical="top"
                placeholder="What happened, where and when?"
                placeholderTextColor={C.textMuted}
                accessibilityLabelledBy="grievance-desc"
                accessibilityLabel="Details"
                style={[styles.input, styles.textarea]}
              />
            </View>

            <Button label="Submit grievance" onPress={submit} loading={create.isPending} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.card, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, paddingHorizontal: Spacing.lg, maxHeight: '92%' },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: '#D1D1D6', marginTop: Spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.sm },
  title: { ...Type.title, color: C.text },
  close: { width: MinTouchTarget, height: MinTouchTarget, alignItems: 'center', justifyContent: 'center', marginRight: -10 },
  label: { ...Type.callout, fontWeight: '600', color: C.text, marginBottom: Spacing.sm },
  hint: { ...Type.caption, color: C.warning, marginTop: Spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: { minHeight: 40, paddingHorizontal: 14, justifyContent: 'center', borderRadius: 20, borderWidth: 1, borderColor: '#D1D1D6', backgroundColor: C.card },
  chipSelected: { backgroundColor: C.primaryContainer, borderColor: C.primaryContainer },
  chipText: { ...Type.subhead, color: C.text },
  chipTextSelected: { color: '#FFFFFF', fontWeight: '600' },
  input: {
    ...Type.body,
    color: C.text,
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: MinTouchTarget + 4,
  },
  textarea: { minHeight: 120 },
  error: { ...Type.subhead, color: C.danger, backgroundColor: C.dangerBg, padding: Spacing.md, borderRadius: Radius.md },
});
