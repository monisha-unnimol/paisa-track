import { CommonActions, NavigationProp, ParamListBase } from '@react-navigation/native';
import { TabParamList } from './tabTypes';

const TAB_ROOT_SCREENS: Partial<Record<keyof TabParamList, string>> = {
  Accounts: 'AccountsList',
  Categories: 'CategoriesList',
  Statements: 'TransactionsList',
  Recurring: 'RecurringList',
  Home: 'HomeMain',
};

export function shouldResetTabStack(
  navigation: NavigationProp<ParamListBase>,
  tabName: keyof TabParamList,
): boolean {
  const rootScreen = TAB_ROOT_SCREENS[tabName];
  if (!rootScreen) return false;

  const state = navigation.getState();
  const tabRoute = state.routes.find((route) => route.name === tabName);
  const stackState = tabRoute?.state;

  if (!stackState || !('routes' in stackState) || !('index' in stackState)) {
    return false;
  }

  const stackIndex = typeof stackState.index === 'number' ? stackState.index : 0;
  const currentRoute = stackState.routes[stackIndex];
  return currentRoute?.name !== rootScreen;
}

export function resetTabStack(
  navigation: NavigationProp<ParamListBase>,
  tabName: keyof TabParamList,
) {
  const rootScreen = TAB_ROOT_SCREENS[tabName];
  if (!rootScreen) return;

  navigation.dispatch((state) => {
    const routes = state.routes.map((route) => {
      if (route.name !== tabName) return route;

      return {
        ...route,
        state: {
          index: 0,
          routes: [{ name: rootScreen }],
        },
      };
    });

    return CommonActions.reset({
      ...state,
      routes,
      index: state.index,
    });
  });
}

export function resetStackToRoot(
  navigation: NavigationProp<ParamListBase>,
  rootRoute: string,
) {
  navigation.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{ name: rootRoute }],
    }),
  );
}
