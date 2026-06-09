import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { formStyles } from '../theme/formStyles';
import { spacing } from '../theme/spacing';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  subtitleStyle?: StyleProp<TextStyle>;
};

export function ScreenHeader({
  title,
  subtitle,
  align = 'left',
  style,
  titleStyle,
  subtitleStyle,
}: ScreenHeaderProps) {
  return (
    <View style={[styles.container, align === 'center' && styles.centered, style]}>
      <Text
        style={[formStyles.screenTitle, align === 'center' && styles.centeredText, titleStyle]}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          style={[
            formStyles.screenSubtitle,
            align === 'center' && styles.centeredText,
            subtitleStyle,
          ]}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    alignSelf: 'stretch',
  },
  centered: {
    alignItems: 'center',
  },
  centeredText: {
    textAlign: 'center',
  },
});
