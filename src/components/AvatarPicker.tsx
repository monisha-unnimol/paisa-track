import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  formatEmojiAvatar,
  formatUriAvatar,
  PREDEFINED_AVATARS,
  parseAvatarValue,
} from '../constants/avatarOptions';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { UserAvatar } from './UserAvatar';

type AvatarPickerProps = {
  name: string;
  avatar: string | null;
  onChange: (avatar: string | null) => void;
  variant?: 'default' | 'centered';
};

export function AvatarPicker({
  name,
  avatar,
  onChange,
  variant = 'default',
}: AvatarPickerProps) {
  const parsed = parseAvatarValue(avatar);
  const selectAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    selectAnim.setValue(0.92);
    Animated.spring(selectAnim, {
      toValue: 1,
      damping: 12,
      stiffness: 180,
      useNativeDriver: true,
    }).start();
  }, [avatar, selectAnim]);

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      onChange(formatUriAvatar(result.assets[0].uri));
    }
  };

  if (variant === 'centered') {
    return (
      <View style={styles.centeredContainer}>
        <Animated.View style={{ transform: [{ scale: selectAnim }] }}>
          <UserAvatar name={name || 'User'} avatar={avatar} size={96} />
        </Animated.View>

        <View style={styles.centeredActions}>
          <Pressable style={styles.actionChip} onPress={handlePickImage}>
            <Ionicons name="image-outline" size={16} color={colors.primaryDark} />
            <Text style={styles.actionChipText}>Upload from gallery</Text>
          </Pressable>
          <Pressable style={styles.actionChip} onPress={() => onChange(null)}>
            <Ionicons name="close-circle-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.actionChipText}>Skip avatar</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.avatarRow}
        >
          {PREDEFINED_AVATARS.map((emoji) => {
            const selected = parsed.type === 'emoji' && parsed.value === emoji;
            return (
              <Pressable
                key={emoji}
                style={[styles.avatarChip, selected && styles.avatarChipSelected]}
                onPress={() => onChange(formatEmojiAvatar(emoji))}
              >
                <Text style={styles.avatarEmoji}>{emoji}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.previewRow}>
        <Animated.View style={{ transform: [{ scale: selectAnim }] }}>
          <UserAvatar name={name || 'User'} avatar={avatar} size={72} />
        </Animated.View>
        <View style={styles.previewActions}>
          <Pressable style={styles.actionChip} onPress={handlePickImage}>
            <Ionicons name="image-outline" size={16} color={colors.primaryDark} />
            <Text style={styles.actionChipText}>Upload from gallery</Text>
          </Pressable>
          <Pressable style={styles.actionChip} onPress={() => onChange(null)}>
            <Ionicons name="close-circle-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.actionChipText}>Skip avatar</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.label}>Choose an avatar</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.avatarRow}
      >
        {PREDEFINED_AVATARS.map((emoji) => {
          const selected = parsed.type === 'emoji' && parsed.value === emoji;
          return (
            <Pressable
              key={emoji}
              style={[styles.avatarChip, selected && styles.avatarChipSelected]}
              onPress={() => onChange(formatEmojiAvatar(emoji))}
            >
              <Text style={styles.avatarEmoji}>{emoji}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  centeredContainer: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.md,
  },
  centeredActions: {
    width: '100%',
    gap: spacing.sm,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  previewActions: {
    flex: 1,
    gap: spacing.sm,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  avatarRow: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  avatarChip: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  avatarEmoji: {
    fontSize: 26,
  },
});
