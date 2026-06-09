import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppSplash } from './src/components/AppSplash';
import { GlobalModals } from './src/components/GlobalModals';
import { useAppBootstrap } from './src/hooks/useAppBootstrap';
import { navigationRef } from './src/navigation/navigationRef';
import { RootNavigator } from './src/navigation/RootNavigator';
import { colors } from './src/theme/colors';

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.surface,
    border: colors.border,
  },
};

export default function App() {
  const isReady = useAppBootstrap();
  const [showSplashOverlay, setShowSplashOverlay] = useState(true);

  const handleSplashExitComplete = useCallback(() => {
    setShowSplashOverlay(false);
  }, []);

  const handleRootLayout = useCallback(async () => {
    if (isReady) {
      await SplashScreen.hideAsync();
    }
  }, [isReady]);

  if (!isReady) {
    return (
      <>
        <StatusBar style="light" />
        <AppSplash />
      </>
    );
  }

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: colors.background }} onLayout={handleRootLayout}>
        <NavigationContainer ref={navigationRef} theme={navigationTheme}>
          <RootNavigator />
          <StatusBar style="dark" />
        </NavigationContainer>
        <GlobalModals />
        {showSplashOverlay && (
          <AppSplash exiting onExitComplete={handleSplashExitComplete} />
        )}
      </View>
    </SafeAreaProvider>
  );
}
