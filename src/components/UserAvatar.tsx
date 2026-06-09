import { Image, StyleSheet, Text, View } from 'react-native';
import { parseAvatarValue, getInitials } from '../constants/avatarOptions';
import { colors } from '../theme/colors';
import { radius } from '../theme/spacing';

type UserAvatarProps = {
  name: string;
  avatar?: string | null;
  size?: number;
};

export function UserAvatar({ name, avatar, size = 44 }: UserAvatarProps) {
  const parsed = parseAvatarValue(avatar);
  const fontSize = Math.round(size * 0.38);
  const initialsSize = Math.round(size * 0.34);

  if (parsed.type === 'uri' && parsed.value) {
    return (
      <Image
        source={{ uri: parsed.value }}
        style={[
          styles.image,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      />
    );
  }

  if (parsed.type === 'emoji' && parsed.value) {
    return (
      <View
        style={[
          styles.emojiWrap,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        <Text style={[styles.emoji, { fontSize }]}>{parsed.value}</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.initialsWrap,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Text style={[styles.initials, { fontSize: initialsSize }]}>
        {getInitials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.border,
  },
  emojiWrap: {
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
  },
  emoji: {
    textAlign: 'center',
  },
  initialsWrap: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
