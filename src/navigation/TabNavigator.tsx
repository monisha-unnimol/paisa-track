import { Ionicons } from '@expo/vector-icons';
import {
  BottomTabBar,
  BottomTabBarProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { UnsavedChangesModal } from '../components/UnsavedChangesModal';
import { HomeStackNavigator } from './HomeStackNavigator';
import { useUnsavedChangesStore } from '../store/useUnsavedChangesStore';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { AccountsStackNavigator } from './AccountsStackNavigator';
import { CategoriesStackNavigator } from './CategoriesStackNavigator';
import { RecurringStackNavigator } from './RecurringStackNavigator';
import { resetTabStack, shouldResetTabStack } from './resetTabStack';
import { TabParamList } from './tabTypes';
import { TransactionsStackNavigator } from './TransactionsStackNavigator';

export type { TabParamList } from './tabTypes';

const Tab = createBottomTabNavigator<TabParamList>();

type TabIconName = keyof typeof Ionicons.glyphMap;

const tabConfig: Record<
  keyof TabParamList,
  { label: string; icon: TabIconName; activeIcon: TabIconName }
> = {
  Home: { label: 'Home', icon: 'home-outline', activeIcon: 'home' },
  Accounts: { label: 'Accounts', icon: 'wallet-outline', activeIcon: 'wallet' },
  Categories: { label: 'Spending Limits', icon: 'grid-outline', activeIcon: 'grid' },
  Statements: {
    label: 'Statements',
    icon: 'document-text-outline',
    activeIcon: 'document-text',
  },
  Recurring: {
    label: 'Recurring',
    icon: 'repeat-outline',
    activeIcon: 'repeat',
  },
};

const STACK_TABS: Array<keyof TabParamList> = [
  'Home',
  'Accounts',
  'Categories',
  'Statements',
  'Recurring',
];

const styles = StyleSheet.create({
  scene: {
    backgroundColor: colors.background,
  },
  tabBarBackdrop: {
    backgroundColor: colors.background,
  },
  tabBarBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
  },
});

const tabScreenOptions = {
  headerShown: false as const,
  lazy: false,
  animation: 'none' as const,
  sceneContainerStyle: styles.scene,
};

function AppTabBar(props: BottomTabBarProps) {
  return (
    <View style={styles.tabBarBackdrop}>
      <BottomTabBar {...props} />
    </View>
  );
}

export function TabNavigator() {
  const [discardVisible, setDiscardVisible] = useState(false);
  const pendingTabRef = useRef<keyof TabParamList | null>(null);
  const sourceTabRef = useRef<keyof TabParamList | null>(null);
  const tabNavigationRef = useRef<NavigationProp<ParamListBase> | null>(null);

  const handleConfirmDiscard = () => {
    const navigation = tabNavigationRef.current;
    const targetTab = pendingTabRef.current;
    const sourceTab = sourceTabRef.current;

    setDiscardVisible(false);
    pendingTabRef.current = null;
    sourceTabRef.current = null;

    if (!navigation || !targetTab) return;

    useUnsavedChangesStore.getState().enableNavigationBypass();
    useUnsavedChangesStore.getState().clearAll();

    if (sourceTab) {
      resetTabStack(navigation, sourceTab);
    }

    navigation.navigate(targetTab as never);

    requestAnimationFrame(() => {
      useUnsavedChangesStore.getState().disableNavigationBypass();
    });
  };

  return (
    <>
      <UnsavedChangesModal
        visible={discardVisible}
        onConfirm={handleConfirmDiscard}
        onCancel={() => {
          setDiscardVisible(false);
          pendingTabRef.current = null;
          sourceTabRef.current = null;
        }}
      />

      <Tab.Navigator
        tabBar={(props) => <AppTabBar {...props} />}
        screenOptions={({ route }) => ({
          ...tabScreenOptions,
          tabBarActiveTintColor: colors.tabActive,
          tabBarInactiveTintColor: colors.tabInactive,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopWidth: 0,
            elevation: 12,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
            height: 88,
            paddingTop: spacing.sm,
            paddingBottom: spacing.lg,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            overflow: 'hidden',
          },
          tabBarBackground: () => (
            <View style={styles.tabBarBackground} />
          ),
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginTop: 2,
          },
          tabBarIcon: ({ focused, color, size }) => {
            const config = tabConfig[route.name];
            const iconName = focused ? config.activeIcon : config.icon;
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
        screenListeners={({ navigation, route }) => {
          tabNavigationRef.current = navigation as NavigationProp<ParamListBase>;

          return {
            tabPress: (event) => {
              const state = navigation.getState();
              const currentTab = state.routes[state.index].name as keyof TabParamList;
              const targetTab = route.name as keyof TabParamList;

              if (currentTab === targetTab) return;

              const leavingStackTab = STACK_TABS.includes(currentTab);
              const needsStackReset = leavingStackTab
                ? shouldResetTabStack(navigation, currentTab)
                : false;

              if (needsStackReset && useUnsavedChangesStore.getState().hasUnsaved()) {
                event.preventDefault();
                sourceTabRef.current = currentTab;
                pendingTabRef.current = targetTab;
                setDiscardVisible(true);
                return;
              }

              if (needsStackReset) {
                resetTabStack(navigation, currentTab);
              }
            },
          };
        }}
      >
        <Tab.Screen name="Home" component={HomeStackNavigator} />
        <Tab.Screen name="Accounts" component={AccountsStackNavigator} />
        <Tab.Screen name="Categories" component={CategoriesStackNavigator} />
        <Tab.Screen name="Statements" component={TransactionsStackNavigator} />
        <Tab.Screen name="Recurring" component={RecurringStackNavigator} />
      </Tab.Navigator>
    </>
  );
}
