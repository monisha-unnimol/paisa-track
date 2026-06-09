import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';

export const stackScreenOptions: NativeStackNavigationOptions = {
  headerStyle: { backgroundColor: colors.background },
  headerShadowVisible: false,
  headerTintColor: colors.primary,
  headerTitleStyle: {
    fontWeight: '700',
    color: colors.text,
  },
  contentStyle: { backgroundColor: colors.background },
  animation: 'slide_from_right',
  animationDuration: 280,
};

export const formScreenOptions: NativeStackNavigationOptions = {
  ...stackScreenOptions,
  animation: 'slide_from_bottom',
  animationDuration: 320,
};

export const successScreenOptions: NativeStackNavigationOptions = {
  headerShown: false,
  animation: 'fade',
  animationDuration: 320,
  gestureEnabled: false,
};
