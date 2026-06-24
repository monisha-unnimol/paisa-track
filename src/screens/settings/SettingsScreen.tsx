import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AppSwitch } from '../../components/AppSwitch';
import { BackupRestoreDialogs } from '../../components/backup/BackupRestoreDialogs';
import { Card } from '../../components/Card';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { SettingsDataActionRow } from '../../components/settings/SettingsDataActionRow';
import { ScreenContainer } from '../../components/ScreenContainer';
import { UserAvatar } from '../../components/UserAvatar';
import {
  BACKUP_COPY,
  ERROR_COPY,
  SMS_COPY,
  SUCCESS_COPY,
} from '../../constants/dialogCopy';
import { HomeStackParamList } from '../../navigation/HomeStackNavigator';
import { navigateToOperationSuccess } from '../../navigation/operationSuccess';
import { createAndSaveBackup } from '../../services/backup/backupService';
import { createAndSavePdfReport } from '../../services/reports/pdfReportService';
import { verifyExportFileExists } from '../../services/files/paisaTrackFileStorage';
import { useBackupRestoreFlow } from '../../hooks/useBackupRestoreFlow';
import { getSmsTrackingStatus } from '../../services/sms/smsTrackingService';
import { isSmsListenerAvailable } from '../../services/sms/smsListenerService';
import { useModalStore } from '../../store/useModalStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useUserProfileStore } from '../../store/useUserProfileStore';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type Props = NativeStackScreenProps<HomeStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: Props) {
  const showError = useModalStore((state) => state.showError);
  const profile = useUserProfileStore((state) => state.profile);
  const displayName = useUserProfileStore((state) => state.getDisplayName());
  const {
    smsAutoTrackingEnabled,
    hydrated,
    smsInvalidStateDetected,
    clearSmsInvalidState,
    loadSettings,
    setSmsAutoTrackingEnabled,
  } = useSettingsStore();
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [explainVisible, setExplainVisible] = useState(false);
  const [invalidStateVisible, setInvalidStateVisible] = useState(false);
  const [backupWarningVisible, setBackupWarningVisible] = useState(false);
  const [backupBusy, setBackupBusy] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);

  const handleSettingsRestoreSuccess = useCallback(async () => {
    navigateToOperationSuccess(navigation, {
      title: SUCCESS_COPY.restoreComplete.title,
      message: SUCCESS_COPY.restoreComplete.message,
      listRoute: 'HomeMain',
      confirmLabel: 'Restart App',
      reloadApp: true,
    });
  }, [navigation]);

  const restoreFlow = useBackupRestoreFlow({
    onRestoreSuccess: handleSettingsRestoreSuccess,
  });
  const restoreBusy = restoreFlow.restoreBusy;

  const smsAvailable = Platform.OS === 'android' && isSmsListenerAvailable();

  const refreshStatus = useCallback(async () => {
    setCheckingStatus(true);
    try {
      const status = await getSmsTrackingStatus();
      setPermissionGranted(status.permissionGranted);
    } finally {
      setCheckingStatus(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function load() {
        if (!useSettingsStore.getState().hydrated) {
          const result = await loadSettings();
          if (!active) return;
          if (result === 'disabled_invalid') {
            setInvalidStateVisible(true);
          }
        } else if (smsInvalidStateDetected) {
          setInvalidStateVisible(true);
        }

        await refreshStatus();
      }

      load().catch(console.error);

      return () => {
        active = false;
      };
    }, [loadSettings, refreshStatus, smsInvalidStateDetected]),
  );

  const handleEnableResult = async (result: Awaited<ReturnType<typeof setSmsAutoTrackingEnabled>>) => {
    if (result === 'unavailable') {
      showError(
        ERROR_COPY.smsTrackingUnavailable.title,
        ERROR_COPY.smsTrackingUnavailable.message,
      );
    } else if (result === 'blocked') {
      showError(
        ERROR_COPY.smsPermissionBlocked.title,
        ERROR_COPY.smsPermissionBlocked.message,
      );
      Linking.openSettings();
    } else if (result === 'denied') {
      showError(
        ERROR_COPY.smsPermissionDenied.title,
        ERROR_COPY.smsPermissionDenied.message,
      );
    }
    await refreshStatus();
  };

  const handleToggle = async (nextValue: boolean) => {
    if (updating) return;

    if (!nextValue) {
      setUpdating(true);
      try {
        await setSmsAutoTrackingEnabled(false);
        await refreshStatus();
      } finally {
        setUpdating(false);
      }
      return;
    }

    setExplainVisible(true);
  };

  const handleConfirmEnable = async () => {
    setExplainVisible(false);
    setUpdating(true);
    try {
      const result = await setSmsAutoTrackingEnabled(true);
      await handleEnableResult(result);
    } finally {
      setUpdating(false);
    }
  };

  const handleBackupPress = () => {
    if (backupBusy) return;
    setBackupWarningVisible(true);
  };

  const handleExportError = (reason: string, context: 'backup' | 'pdf' = 'backup') => {
    if (reason === 'cancelled') {
      showError(BACKUP_COPY.exportCancelled.title, BACKUP_COPY.exportCancelled.message);
      return;
    }

    if (reason === 'verify_failed') {
      showError(BACKUP_COPY.exportVerifyFailed.title, BACKUP_COPY.exportVerifyFailed.message);
      return;
    }

    if (reason === 'generate_failed' || context === 'pdf') {
      showError(BACKUP_COPY.pdfFailed.title, BACKUP_COPY.pdfFailed.message);
      return;
    }

    showError(BACKUP_COPY.backupFailed.title, BACKUP_COPY.backupFailed.message);
  };

  const handleConfirmBackup = async () => {
    setBackupWarningVisible(false);
    setBackupBusy(true);
    try {
      const result = await createAndSaveBackup();
      if (!result.ok) {
        handleExportError(result.reason);
        return;
      }

      const fileReady = await verifyExportFileExists(result.shareableUri);
      if (!fileReady) {
        showError(BACKUP_COPY.exportVerifyFailed.title, BACKUP_COPY.exportVerifyFailed.message);
        return;
      }

      console.log('[Backup] Success navigation URIs:', {
        savedUri: result.fileUri,
        shareableUri: result.shareableUri,
      });

      navigateToOperationSuccess(navigation, {
        title: SUCCESS_COPY.backupCreated.title,
        message: SUCCESS_COPY.backupCreated.message,
        listRoute: 'Settings',
        confirmLabel: 'Done',
        secondaryLabel: 'Share Backup',
        fileName: result.fileName,
        savedPath: result.displayPath,
        shareUri: result.shareableUri,
        shareMimeType: 'application/json',
      });
    } finally {
      setBackupBusy(false);
    }
  };

  const handleExportPdf = async () => {
    if (pdfBusy || backupBusy || restoreBusy) return;

    setPdfBusy(true);
    try {
      const result = await createAndSavePdfReport();
      if (!result.ok) {
        handleExportError(result.reason, 'pdf');
        return;
      }

      const fileReady = await verifyExportFileExists(result.shareableUri);
      if (!fileReady) {
        showError(BACKUP_COPY.exportVerifyFailed.title, BACKUP_COPY.exportVerifyFailed.message);
        return;
      }

      console.log('[PDF] Success navigation URIs:', {
        savedUri: result.fileUri,
        shareableUri: result.shareableUri,
      });

      navigateToOperationSuccess(navigation, {
        title: SUCCESS_COPY.pdfGenerated.title,
        message: SUCCESS_COPY.pdfGenerated.message,
        listRoute: 'Settings',
        confirmLabel: 'Done',
        tertiaryLabel: 'Open PDF',
        secondaryLabel: 'Share PDF',
        fileName: result.fileName,
        savedPath: result.displayPath,
        openFileUri: result.shareableUri,
        shareUri: result.shareableUri,
        shareMimeType: 'application/pdf',
      });
    } finally {
      setPdfBusy(false);
    }
  };

  const handleRestorePress = () => {
    void restoreFlow.startRestore();
  };

  if (!hydrated) {
    return (
      <ScreenContainer scrollable={false} omitTopInset>
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer omitTopInset>
      <BackupRestoreDialogs flow={restoreFlow} />

      <ConfirmationModal
        visible={explainVisible}
        title={SMS_COPY.enableExplanation.title}
        message={SMS_COPY.enableExplanation.message}
        confirmLabel={SMS_COPY.enableExplanation.confirmLabel}
        cancelLabel={SMS_COPY.enableExplanation.cancelLabel}
        icon="chatbubble-ellipses-outline"
        onConfirm={handleConfirmEnable}
        onCancel={() => setExplainVisible(false)}
      />

      <ConfirmationModal
        visible={invalidStateVisible}
        title={ERROR_COPY.smsTrackingInvalidState.title}
        message={ERROR_COPY.smsTrackingInvalidState.message}
        confirmLabel="Got It"
        singleAction
        icon="alert-circle-outline"
        onConfirm={() => {
          setInvalidStateVisible(false);
          clearSmsInvalidState();
        }}
      />

      <ConfirmationModal
        visible={backupWarningVisible}
        title={BACKUP_COPY.sensitiveDataWarning.title}
        message={BACKUP_COPY.sensitiveDataWarning.message}
        confirmLabel={BACKUP_COPY.sensitiveDataWarning.confirmLabel}
        cancelLabel={BACKUP_COPY.sensitiveDataWarning.cancelLabel}
        icon="shield-outline"
        onConfirm={handleConfirmBackup}
        onCancel={() => setBackupWarningVisible(false)}
      />

      <Pressable
        style={({ pressed }) => [styles.profileRow, pressed && styles.profileRowPressed]}
        onPress={() => navigation.navigate('EditProfile', { returnRoute: 'Settings' })}
        accessibilityLabel="Edit profile"
        accessibilityRole="button"
      >
        <Card style={styles.profileCard}>
          <UserAvatar name={displayName} avatar={profile?.avatar} size={52} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.profileAction}>Edit name and avatar</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Card>
      </Pressable>

      <Text style={styles.sectionLabel}>Security</Text>

      <Pressable
        style={({ pressed }) => [styles.securityRow, pressed && styles.securityRowPressed]}
        onPress={() => navigation.navigate('ChangePin')}
        accessibilityLabel="Change PIN"
        accessibilityRole="button"
      >
        <Card style={styles.securityCard}>
          <View style={styles.securityIconWrap}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.securityInfo}>
            <Text style={styles.settingLabel}>Change PIN</Text>
            <Text style={styles.settingDescription}>
              Update the PIN used to reveal account balances and financial summaries.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Card>
      </Pressable>

      <Text style={styles.sectionLabel}>Preferences</Text>

      <Card style={styles.settingCard}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>SMS Tracking</Text>
            <Text style={styles.settingDescription}>
              Detect bank transaction SMS and create review requests automatically.
            </Text>
            {!smsAvailable && (
              <Text style={styles.settingMuted}>
                SMS tracking requires a development or release build. It does not work in Expo Go.
              </Text>
            )}
          </View>
          <AppSwitch
            value={smsAutoTrackingEnabled}
            onValueChange={handleToggle}
            disabled={!smsAvailable || updating || checkingStatus}
            accessibilityLabel="SMS tracking"
          />
        </View>

        {smsAvailable && (
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>SMS Permission</Text>
            {checkingStatus ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text
                style={[
                  styles.statusValue,
                  permissionGranted ? styles.statusGranted : styles.statusDenied,
                ]}
              >
                {permissionGranted ? 'Granted' : 'Not Granted'}
              </Text>
            )}
          </View>
        )}

        {smsAutoTrackingEnabled && permissionGranted && (
          <View style={styles.activeRow}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={styles.activeText}>SMS tracking is active</Text>
          </View>
        )}

        {smsAutoTrackingEnabled && !permissionGranted && !checkingStatus && (
          <Text style={styles.settingWarning}>
            SMS permission is required. Turn the switch off and on again to grant access.
          </Text>
        )}
      </Card>

      {smsAvailable && (
        <Pressable
          style={({ pressed }) => [styles.linkRow, pressed && styles.linkRowPressed]}
          onPress={() => {
            Linking.openSettings();
          }}
        >
          <Ionicons name="open-outline" size={18} color={colors.primary} />
          <Text style={styles.linkText}>Open system app settings</Text>
        </Pressable>
      )}

      <Text style={styles.sectionLabel}>Data Management</Text>

      <Card style={styles.dataCard}>
        <SettingsDataActionRow
          label="Backup Data"
          subtitle="Create a backup of all PaisaTrack data"
          icon="download-outline"
          onPress={handleBackupPress}
          disabled={backupBusy || restoreBusy || pdfBusy}
          loading={backupBusy}
        />
        <SettingsDataActionRow
          label="Restore Data"
          subtitle="Restore data from a backup file"
          icon="folder-open-outline"
          onPress={handleRestorePress}
          disabled={backupBusy || restoreBusy || pdfBusy}
          loading={restoreBusy}
          showDivider
        />
        <SettingsDataActionRow
          label="Export PDF Report"
          subtitle="Generate and save a financial report"
          icon="document-text-outline"
          onPress={handleExportPdf}
          disabled={backupBusy || restoreBusy || pdfBusy}
          loading={pdfBusy}
          showDivider
        />
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loader: {
    marginTop: spacing.xl,
  },
  profileRow: {
    marginBottom: spacing.lg,
  },
  profileRowPressed: {
    opacity: 0.92,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  profileAction: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  securityRow: {
    marginBottom: spacing.lg,
  },
  securityRowPressed: {
    opacity: 0.92,
  },
  securityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  securityIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityInfo: {
    flex: 1,
    gap: 2,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  settingCard: {
    gap: spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  settingInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 22,
  },
  settingDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  settingWarning: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.warning,
    fontWeight: '600',
  },
  settingMuted: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textMuted,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusGranted: {
    color: colors.success,
  },
  statusDenied: {
    color: colors.warning,
  },
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  activeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.success,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  linkRowPressed: {
    opacity: 0.85,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  dataCard: {
    marginBottom: spacing.lg,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
});
