import { CommonActions, NavigationProp, ParamListBase } from '@react-navigation/native';
import { useEffect } from 'react';
import { useUnsavedChangesStore } from '../store/useUnsavedChangesStore';
import { shouldResetTabStack } from '../navigation/resetTabStack';
import { TabParamList } from '../navigation/tabTypes';

type StackNavigation = Pick<NavigationProp<ParamListBase>, 'getParent' | 'getState' | 'dispatch'>;

export function useTabStackResetOnBlur(
  navigation: StackNavigation,
  rootRoute: string,
  tabName: keyof TabParamList,
) {
  useEffect(() => {
    const tabNavigation = navigation.getParent();
    if (!tabNavigation) return;

    const unsubscribe = tabNavigation.addListener('blur', () => {
      if (!shouldResetTabStack(tabNavigation as NavigationProp<ParamListBase>, tabName)) {
        return;
      }

      useUnsavedChangesStore.getState().enableNavigationBypass();
      useUnsavedChangesStore.getState().clearAll();

      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: rootRoute }],
        }),
      );

      requestAnimationFrame(() => {
        useUnsavedChangesStore.getState().disableNavigationBypass();
      });
    });

    return unsubscribe;
  }, [navigation, rootRoute, tabName]);
}
