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
import { Card } from '../../components/Card';
import { ScreenContainer } from '../../components/ScreenContainer';
import { UserAvatar } from '../../components/UserAvatar';
import { ERROR_COPY } from '../../constants/dialogCopy';
import { HomeStackParamList } from '../../navigation/HomeStackNavigator';
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
  const { smsAutoTrackingEnabled, hydrated, loadSettings, setSmsAutoTrackingEnabled } =
    useSettingsStore();
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [updating, setUpdating] = useState(false);

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
      if (!useSettingsStore.getState().hydrated) {
        loadSettings().catch(console.error);
      }
      refreshStatus();
    }, [loadSettings, refreshStatus]),
  );

  const handleToggle = async (nextValue: boolean) => {
    if (updating) return;

    setUpdating(true);
    try {
      const result = await setSmsAutoTrackingEnabled(nextValue);
      if (nextValue) {
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
      }
      await refreshStatus();
    } finally {
      setUpdating(false);
    }
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
            <Text style={styles.settingLabel}>Automatic Expense Tracking from SMS</Text>
            <Text style={styles.settingDescription}>
              Detect bank transaction SMS and create review requests automatically.
            </Text>
            {smsAutoTrackingEnabled && smsAvailable && !permissionGranted && !checkingStatus && (
              <Text style={styles.settingWarning}>
                SMS permission is required. Turn the switch off and on again to grant access.
              </Text>
            )}
            {!smsAvailable && (
              <Text style={styles.settingMuted}>
                SMS tracking is only available on Android builds that include the SMS module.
              </Text>
            )}
          </View>
          <AppSwitch
            value={smsAutoTrackingEnabled}
            onValueChange={handleToggle}
            disabled={!smsAvailable || updating || checkingStatus}
            accessibilityLabel="Automatic expense tracking from SMS"
          />
        </View>

        {smsAutoTrackingEnabled && permissionGranted && (
          <View style={styles.statusRow}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={styles.statusText}>SMS tracking is active</Text>
          </View>
        )}
      </Card>

      {permissionGranted && (
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
    gap: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statusText: {
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
});
