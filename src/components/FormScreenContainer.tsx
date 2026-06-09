import { useHeaderHeight } from '@react-navigation/elements';
import { ReactNode, RefObject } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Edge, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

export type FormScreenContainerProps = {
  children: ReactNode;
  /** Fixed action row pinned below the scroll area. */
  footer?: ReactNode;
  /** Vertically center scroll content in the area above the footer. */
  centerContent?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  scrollRef?: RefObject<KeyboardAwareScrollView | null>;
  extraScrollHeight?: number;
  /** Include native stack header height in iOS keyboard offset. Default true. */
  useStackHeaderOffset?: boolean;
  safeAreaEdges?: Edge[];
};

const DEFAULT_EXTRA_SCROLL = 32;

export function FormScreenContainer({
  children,
  footer,
  centerContent = false,
  contentContainerStyle,
  style,
  scrollRef,
  extraScrollHeight = DEFAULT_EXTRA_SCROLL,
  useStackHeaderOffset = true,
  safeAreaEdges = ['bottom', 'left', 'right'],
}: FormScreenContainerProps) {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const keyboardOffset =
    useStackHeaderOffset && Platform.OS === 'ios' ? headerHeight : 0;
  const scrollPadding =
    extraScrollHeight +
    (useStackHeaderOffset && Platform.OS === 'ios' ? headerHeight : 0);

  return (
    <SafeAreaView style={[styles.container, style]} edges={safeAreaEdges}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={keyboardOffset}
      >
        <View style={styles.body}>
          <KeyboardAwareScrollView
            ref={scrollRef}
            style={styles.scroll}
            contentContainerStyle={[
              styles.content,
              centerContent && styles.contentCentered,
              contentContainerStyle,
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            enableOnAndroid
            enableAutomaticScroll
            extraScrollHeight={scrollPadding}
            extraHeight={scrollPadding}
            keyboardOpeningTime={0}
            enableResetScrollToCoords={false}
          >
            {children}
          </KeyboardAwareScrollView>

          {footer ? (
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
              {footer}
            </View>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    alignItems: 'stretch',
    alignSelf: 'stretch',
    width: '100%',
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  contentCentered: {
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
