import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

type ScreenContainerProps = {
  children: ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  bottomInset?: boolean;
  /** Set when the screen uses a native stack header (avoids double top inset). */
  omitTopInset?: boolean;
};

export function ScreenContainer({
  children,
  scrollable = true,
  style,
  contentStyle,
  bottomInset = false,
  omitTopInset = false,
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();

  const content = (
    <View style={[styles.content, contentStyle, style]}>
      {children}
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: omitTopInset ? 0 : insets.top,
          paddingBottom: bottomInset ? insets.bottom : 0,
        },
      ]}
    >
      {scrollable ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scrollContent,
            bottomInset && { paddingBottom: spacing.xl + insets.bottom },
          ]}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
});
