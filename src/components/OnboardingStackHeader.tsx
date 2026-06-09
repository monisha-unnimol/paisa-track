import { StyleSheet, Text, View } from 'react-native';
import { formStyles } from '../theme/formStyles';

type OnboardingStackHeaderProps = {
  title: string;
  subtitle: string;
};

export function OnboardingStackHeader({ title, subtitle }: OnboardingStackHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <Text style={styles.subtitle} numberOfLines={2}>
        {subtitle}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    gap: 2,
    maxWidth: '100%',
  },
  title: {
    ...formStyles.screenTitle,
    fontSize: 17,
    letterSpacing: -0.2,
  },
  subtitle: {
    ...formStyles.screenSubtitle,
    fontSize: 13,
    lineHeight: 17,
  },
});
