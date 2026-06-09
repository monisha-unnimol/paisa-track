import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { OnboardingScreen } from '../../components/OnboardingScreen';
import { PrimaryButton } from '../../components/PrimaryButton';
import { APP_ICON, APP_NAME } from '../../constants/appBranding';
import { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';
import { colors } from '../../theme/colors';
import { formStyles } from '../../theme/formStyles';
import { radius, spacing } from '../../theme/spacing';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Welcome'>;

const TAGLINE = 'Smart expense tracking\nfor everyday life';
const DESCRIPTION =
  'Take control of your finances, track expenses, manage investments, and stay on top of recurring payments.';

export function WelcomeScreen({ navigation }: Props) {
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroTranslate = useRef(new Animated.Value(12)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(100, [
      Animated.parallel([
        Animated.timing(heroOpacity, {
          toValue: 1,
          duration: 360,
          useNativeDriver: true,
        }),
        Animated.spring(heroTranslate, {
          toValue: 0,
          damping: 16,
          stiffness: 140,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [buttonOpacity, heroOpacity, heroTranslate]);

  return (
    <OnboardingScreen
      centerContent
      useStackHeaderOffset={false}
      safeAreaEdges={['top', 'left', 'right', 'bottom']}
      footer={
        <Animated.View style={{ opacity: buttonOpacity }}>
          <PrimaryButton
            label="Get Started"
            onPress={() => navigation.navigate('ProfileSetup')}
            compact
          />
        </Animated.View>
      }
    >
      <Animated.View
        style={[
          styles.hero,
          {
            opacity: heroOpacity,
            transform: [{ translateY: heroTranslate }],
          },
        ]}
      >
        <View style={styles.logoWrap}>
          <View style={styles.logoGlow} />
          <Image source={APP_ICON} style={styles.logo} accessibilityLabel={`${APP_NAME} logo`} />
        </View>

        <Text style={formStyles.screenTitle}>{APP_NAME}</Text>
        <Text style={[formStyles.screenSubtitle, styles.tagline]}>{TAGLINE}</Text>
        <Text style={[formStyles.hint, styles.description]}>{DESCRIPTION}</Text>
      </Animated.View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  logoGlow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: radius.full,
    backgroundColor: `${colors.primary}18`,
  },
  logo: {
    width: 112,
    height: 112,
    borderRadius: radius.xl,
  },
  tagline: {
    textAlign: 'center',
    fontWeight: '600',
    color: colors.text,
  },
  description: {
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 20,
    fontSize: 14,
  },
});
