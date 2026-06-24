import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BackupRestoreDialogs } from '../../components/backup/BackupRestoreDialogs';
import { Card } from '../../components/Card';
import { OnboardingScreen } from '../../components/OnboardingScreen';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenHeader } from '../../components/ScreenHeader';
import { BACKUP_COPY, SUCCESS_COPY } from '../../constants/dialogCopy';
import { useBackupRestoreFlow } from '../../hooks/useBackupRestoreFlow';
import { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';
import { navigateToOperationSuccess } from '../../navigation/operationSuccess';
import { colors } from '../../theme/colors';
import { formStyles } from '../../theme/formStyles';
import { radius, spacing } from '../../theme/spacing';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'SetupMethod'>;

export function SetupMethodScreen({ navigation }: Props) {
  const handleRestoreSuccess = useCallback(async () => {
    navigateToOperationSuccess(navigation, {
      title: SUCCESS_COPY.backupRestored.title,
      message: SUCCESS_COPY.backupRestored.message,
      listRoute: 'OnboardingPostRestore',
      confirmLabel: 'Continue',
    });
  }, [navigation]);

  const restoreFlow = useBackupRestoreFlow({
    confirmCopy: BACKUP_COPY.onboardingRestoreConfirm,
    restoreOptions: { deferOnboardingCompletion: true },
    onRestoreSuccess: handleRestoreSuccess,
  });

  return (
    <>
      <BackupRestoreDialogs flow={restoreFlow} />

      <OnboardingScreen
        centerContent
        useStackHeaderOffset={false}
        footer={
          <Pressable
            style={({ pressed }) => [styles.backLink, pressed && styles.backLinkPressed]}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Back to welcome"
          >
            <Text style={styles.backLinkText}>Back</Text>
          </Pressable>
        }
      >
        <View style={styles.content}>
          <ScreenHeader
            align="center"
            title="Welcome to PaisaTrack"
            subtitle="Choose how you would like to get started."
          />

          <Card style={styles.optionCard}>
            <View style={styles.optionHeader}>
              <View style={styles.optionIconWrap}>
                <Ionicons name="sparkles-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>Create New Setup</Text>
                <Text style={styles.optionDescription}>
                  Start fresh and set up your profile, PIN, and accounts.
                </Text>
              </View>
            </View>
            <PrimaryButton
              label="Get Started"
              onPress={() => navigation.navigate('ProfileSetup')}
              disabled={restoreFlow.restoreBusy}
              compact
            />
          </Card>

          <Card style={styles.optionCard}>
            <View style={styles.optionHeader}>
              <View style={styles.optionIconWrap}>
                <Ionicons name="cloud-download-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>Restore From Backup</Text>
                <Text style={styles.optionDescription}>
                  Restore your PaisaTrack data from a previously exported backup file.
                </Text>
              </View>
            </View>
            <PrimaryButton
              label={restoreFlow.restoreBusy ? 'Restoring...' : 'Restore Backup'}
              onPress={restoreFlow.startRestore}
              disabled={restoreFlow.restoreBusy}
              loading={restoreFlow.restoreBusy}
              compact
            />
          </Card>
        </View>
      </OnboardingScreen>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    alignSelf: 'stretch',
    gap: spacing.lg,
  },
  optionCard: {
    gap: spacing.md,
  },
  optionHeader: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  optionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  optionDescription: {
    ...formStyles.hint,
    lineHeight: 20,
  },
  backLink: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  backLinkPressed: {
    opacity: 0.85,
  },
  backLinkText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
