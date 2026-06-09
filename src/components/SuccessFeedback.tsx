import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Modal, StyleSheet, Text, View } from 'react-native';
import { FeedbackKind, useFeedbackStore } from '../store/useFeedbackStore';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';

const FEEDBACK_META: Record<
  FeedbackKind,
  {
    icon: keyof typeof Ionicons.glyphMap;
    accent: string;
    surface: string;
    ring: string;
  }
> = {
  income_added: {
    icon: 'arrow-down-circle',
    accent: colors.income,
    surface: '#ECFDF5',
    ring: `${colors.income}30`,
  },
  expense_added: {
    icon: 'arrow-up-circle',
    accent: colors.expense,
    surface: '#FEF2F2',
    ring: `${colors.expense}30`,
  },
  transaction_updated: {
    icon: 'checkmark-circle',
    accent: colors.primary,
    surface: colors.primaryLight,
    ring: `${colors.primary}30`,
  },
  transaction_deleted: {
    icon: 'trash',
    accent: colors.danger,
    surface: '#FEF2F2',
    ring: `${colors.danger}30`,
  },
};

const DISPLAY_MS = 1900;

export function SuccessFeedback() {
  const feedback = useFeedbackStore((state) => state.feedback);
  const clearFeedback = useFeedbackStore((state) => state.clearFeedback);

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const contentScale = useRef(new Animated.Value(0.82)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.6)).current;
  const ringOpacity = useRef(new Animated.Value(0.8)).current;
  const titleTranslateY = useRef(new Animated.Value(24)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!feedback) return;

    overlayOpacity.setValue(0);
    contentScale.setValue(0.82);
    contentOpacity.setValue(0);
    iconScale.setValue(0);
    ringScale.setValue(0.6);
    ringOpacity.setValue(0.8);
    titleTranslateY.setValue(24);
    subtitleOpacity.setValue(0);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.spring(contentScale, {
          toValue: 1,
          damping: 14,
          stiffness: 160,
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(iconScale, {
          toValue: 1,
          damping: 10,
          stiffness: 180,
          useNativeDriver: true,
        }),
        Animated.timing(ringScale, {
          toValue: 1.8,
          duration: 680,
          useNativeDriver: true,
        }),
        Animated.timing(ringOpacity, {
          toValue: 0,
          duration: 680,
          useNativeDriver: true,
        }),
        Animated.spring(titleTranslateY, {
          toValue: 0,
          damping: 14,
          stiffness: 170,
          useNativeDriver: true,
        }),
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 320,
          delay: 120,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    const hideTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.timing(contentScale, {
          toValue: 0.94,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) clearFeedback();
      });
    }, DISPLAY_MS);

    return () => clearTimeout(hideTimer);
  }, [
    feedback,
    clearFeedback,
    overlayOpacity,
    contentScale,
    contentOpacity,
    iconScale,
    ringScale,
    ringOpacity,
    titleTranslateY,
    subtitleOpacity,
  ]);

  if (!feedback) return null;

  const meta = FEEDBACK_META[feedback.kind];

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <View style={[styles.backdrop, { backgroundColor: meta.surface }]} />
        <View style={[styles.backdropTint, { backgroundColor: `${meta.accent}12` }]} />

        <Animated.View
          style={[
            styles.content,
            {
              opacity: contentOpacity,
              transform: [{ scale: contentScale }],
            },
          ]}
        >
          <View style={styles.iconStage}>
            <Animated.View
              style={[
                styles.ring,
                {
                  borderColor: meta.ring,
                  opacity: ringOpacity,
                  transform: [{ scale: ringScale }],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: meta.accent,
                  transform: [{ scale: iconScale }],
                },
              ]}
            >
              <Ionicons name={meta.icon} size={56} color="#FFFFFF" />
            </Animated.View>
          </View>

          <Animated.Text
            style={[
              styles.title,
              { color: meta.accent, transform: [{ translateY: titleTranslateY }] },
            ]}
          >
            {feedback.title}
          </Animated.Text>

          {feedback.subtitle ? (
            <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
              {feedback.subtitle}
            </Animated.Text>
          ) : null}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropTint: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
    width: '100%',
  },
  iconStage: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  ring: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: radius.full,
    borderWidth: 3,
  },
  iconCircle: {
    width: 112,
    height: 112,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
