import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  FIRST_ACCOUNT_TEMPLATES,
  FirstAccountTemplate,
} from '../../constants/firstAccountTemplates';
import { formStyles } from '../../theme/formStyles';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

type FirstAccountTemplatesPickerProps = {
  selectedTemplateId: string | null;
  onSelect: (template: FirstAccountTemplate) => void;
};

export function FirstAccountTemplatesPicker({
  selectedTemplateId,
  onSelect,
}: FirstAccountTemplatesPickerProps) {
  return (
    <View style={styles.section}>
      <Text style={formStyles.label}>Quick templates</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.templateRow}
        keyboardShouldPersistTaps="handled"
      >
        {FIRST_ACCOUNT_TEMPLATES.map((template) => {
          const selected = selectedTemplateId === template.id;
          return (
            <Pressable
              key={template.id}
              style={[styles.templateChip, selected && styles.templateChipSelected]}
              onPress={() => onSelect(template)}
            >
              <Text style={styles.templateEmoji}>{template.emoji}</Text>
              <Text
                style={[styles.templateText, selected && styles.templateTextSelected]}
                numberOfLines={2}
              >
                {template.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
    alignSelf: 'stretch',
  },
  templateRow: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  templateChip: {
    width: 132,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    gap: spacing.xs,
  },
  templateChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  templateEmoji: {
    fontSize: 22,
  },
  templateText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  templateTextSelected: {
    color: colors.primaryDark,
  },
});
