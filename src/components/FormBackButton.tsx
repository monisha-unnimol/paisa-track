import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

type FormBackButtonProps = {
  onPress: () => void;
};

export function FormBackButton({ onPress }: FormBackButtonProps) {
  const iconName = Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back';

  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Ionicons name={iconName} size={24} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    marginLeft: Platform.OS === 'ios' ? 0 : 4,
    paddingHorizontal: 4,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
});
