import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { APP_ICON, APP_NAME } from '../constants/appBranding';
import { useUserProfileStore } from '../store/useUserProfileStore';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { UserAvatar } from './UserAvatar';

type HomeHeaderProps = {
  onEditProfile: () => void;
  onOpenSettings: () => void;
};

export function HomeHeader({ onEditProfile, onOpenSettings }: HomeHeaderProps) {
  const profile = useUserProfileStore((state) => state.profile);
  const displayName = useUserProfileStore((state) => state.getDisplayName());

  return (
    <View style={styles.container}>
      <Pressable
        style={({ pressed }) => [styles.leftSection, pressed && styles.pressed]}
        onPress={onEditProfile}
        accessibilityLabel="Edit profile"
        accessibilityRole="button"
      >
        <UserAvatar name={displayName} avatar={profile?.avatar} size={48} />
        <View style={styles.greetingWrap}>
          <Text style={styles.greeting} numberOfLines={1}>
            Hey, {displayName}
          </Text>
        </View>
      </Pressable>

      <View style={styles.rightSection}>
        <View style={styles.brandWrap}>
          <Image source={APP_ICON} style={styles.brandIcon} />
          <Text style={styles.brandName}>{APP_NAME}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.settingsButton, pressed && styles.pressed]}
          onPress={onOpenSettings}
          hitSlop={8}
          accessibilityLabel="Open settings"
        >
          <Ionicons name="settings-outline" size={20} color={colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
  },
  greetingWrap: {
    flex: 1,
    minWidth: 0,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  brandWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  brandIcon: {
    width: 22,
    height: 22,
    borderRadius: 6,
  },
  brandName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  settingsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.88,
  },
});
