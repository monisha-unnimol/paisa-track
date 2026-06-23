import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Card } from '../../components/Card';
import { OnboardingScreen } from '../../components/OnboardingScreen';
import { PrimaryButton } from '../../components/PrimaryButton';
import { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';
import { useUserProfileStore } from '../../store/useUserProfileStore';
import { useOnboardingStore } from '../../store/useOnboardingStore';
import { colors } from '../../theme/colors';
import { formStyles } from '../../theme/formStyles';
import { radius, spacing } from '../../theme/spacing';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Coachmarks'>;

const SETUP_SUMMARY = [
  { key: 'profile', label: 'Profile Created', completed: true },
  { key: 'pin', label: 'PIN Configured', completed: true },
  { key: 'account', label: 'Account Added', completed: true },
] as const;

const TIPS = [
  {
    icon: 'home-outline' as const,
    title: 'Home Dashboard',
    description: 'See your total balance, monthly summary, and recent transactions at a glance.',
  },
  {
    icon: 'wallet-outline' as const,
    title: 'Accounts Tab',
    description: 'Manage all your accounts, balances, and linked transactions in one place.',
  },
  {
    icon: 'document-text-outline' as const,
    title: 'Statements & Recurring',
    description: 'Track income and expenses, and stay on top of recurring bills and investments.',
  },
];

export function CoachmarksScreen({ route }: Props) {
  const completeOnboarding = useUserProfileStore((state) => state.completeOnboarding);
  const clearOnboardingAccount = useOnboardingStore((state) => state.clearOnboardingAccount);
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const smsTrackingStatus = route.params?.smsTrackingStatus ?? 'skipped';

  useEffect(() => {
    Animated.timing(contentOpacity, {
      toValue: 1,
      duration: 420,
      useNativeDriver: true,
    }).start();
  }, [contentOpacity]);

  const handleGetStarted = async () => {
    await clearOnboardingAccount();
    await completeOnboarding();
  };

  const summaryItems = [
    ...SETUP_SUMMARY,
    smsTrackingStatus === 'enabled'
      ? { key: 'sms-enabled', label: 'SMS Tracking Enabled', completed: true }
      : { key: 'sms-skipped', label: 'SMS Tracking Skipped', completed: false },
  ];

  return (
    <OnboardingScreen
      useStackHeaderOffset
      footer={
        <PrimaryButton
          label="Get Started"
          onPress={handleGetStarted}
          accessibilityLabel="Get started with PaisaTrack"
          compact
        />
      }
    >
      <Animated.View style={{ opacity: contentOpacity, gap: spacing.md }}>
        <Text style={formStyles.screenSubtitle}>
          You are all set. Here is what was configured during setup.
        </Text>

        <Card style={styles.summaryCard}>
          {summaryItems.map((item) => (
            <View key={item.key} style={styles.summaryRow}>
              <Ionicons
                name={item.completed ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={item.completed ? colors.success : colors.textMuted}
              />
              <Text
                style={[
                  styles.summaryLabel,
                  !item.completed && styles.summaryLabelMuted,
                ]}
              >
                {item.label}
              </Text>
            </View>
          ))}
        </Card>

        <Text style={[formStyles.screenSubtitle, styles.tipsHeading]}>
          A few tips to help you get the most out of PaisaTrack.
        </Text>

        <View style={styles.tips}>
          {TIPS.map((tip) => (
            <Card key={tip.title} style={styles.tipCard}>
              <View style={styles.tipIconWrap}>
                <Ionicons name={tip.icon} size={22} color={colors.primary} />
              </View>
              <View style={styles.tipContent}>
                <Text style={formStyles.label}>{tip.title}</Text>
                <Text style={formStyles.hint}>{tip.description}</Text>
              </View>
            </Card>
          ))}
        </View>
      </Animated.View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    gap: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  summaryLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  summaryLabelMuted: {
    color: colors.textSecondary,
    fontWeight: '500',
  },
  tipsHeading: {
    marginTop: spacing.xs,
  },
  tips: {
    gap: spacing.md,
  },
  tipCard: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  tipIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipContent: {
    flex: 1,
    gap: spacing.xs,
  },
});
