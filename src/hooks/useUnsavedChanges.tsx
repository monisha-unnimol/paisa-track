import { CommonActions, NavigationProp, ParamListBase } from '@react-navigation/native';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { FormBackButton } from '../components/FormBackButton';
import { resetStackToRoot } from '../navigation/resetTabStack';
import { useUnsavedChangesStore } from '../store/useUnsavedChangesStore';
import { useFormEditingGuard } from './useFormEditingGuard';

type UseUnsavedChangesOptions = {
  formId: string;
  navigation: NavigationProp<ParamListBase>;
  rootRoute: string;
  onDiscard?: () => void;
  preferGoBack?: boolean;
};

export function useUnsavedChanges({
  formId,
  navigation,
  rootRoute,
  onDiscard,
  preferGoBack = false,
}: UseUnsavedChangesOptions) {
  const { isDirty, touch, resetDirty } = useFormEditingGuard(formId, formId);
  const [discardVisible, setDiscardVisible] = useState(false);
  const pendingLeaveRef = useRef<(() => void) | null>(null);
  const allowLeaveRef = useRef(false);

  const prepareNavigation = useCallback(() => {
    allowLeaveRef.current = true;
    useUnsavedChangesStore.getState().enableNavigationBypass();
  }, []);

  const exitForm = useCallback(() => {
    prepareNavigation();
    resetDirty();

    if (preferGoBack && navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    const state = navigation.getState();
    if (state.index > 0 || state.routes.length > 1) {
      resetStackToRoot(navigation, rootRoute);
      return;
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate(rootRoute as never);
  }, [navigation, preferGoBack, prepareNavigation, resetDirty, rootRoute]);

  const confirmDiscard = useCallback(() => {
    setDiscardVisible(false);
    onDiscard?.();
    resetDirty();
    prepareNavigation();

    if (pendingLeaveRef.current) {
      const action = pendingLeaveRef.current;
      pendingLeaveRef.current = null;
      action();
      return;
    }

    exitForm();
  }, [exitForm, onDiscard, prepareNavigation, resetDirty]);

  const cancelDiscard = useCallback(() => {
    setDiscardVisible(false);
    pendingLeaveRef.current = null;
  }, []);

  const requestLeave = useCallback(
    (leaveAction?: () => void) => {
      const action = leaveAction ?? exitForm;

      if (isDirty) {
        pendingLeaveRef.current = action;
        setDiscardVisible(true);
        return;
      }

      action();
    },
    [exitForm, isDirty],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerBackVisible: false,
      headerLeft: () => <FormBackButton onPress={() => requestLeave()} />,
    });
  }, [navigation, requestLeave]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      const bypass = useUnsavedChangesStore.getState().navigationBypass;
      if (allowLeaveRef.current || bypass || !isDirty) return;

      event.preventDefault();
      pendingLeaveRef.current = () => {
        prepareNavigation();
        navigation.dispatch(event.data.action);
      };
      setDiscardVisible(true);
    });

    return unsubscribe;
  }, [isDirty, navigation, prepareNavigation]);

  useEffect(() => {
    return () => {
      useUnsavedChangesStore.getState().unregister(formId);
      useUnsavedChangesStore.getState().disableNavigationBypass();
    };
  }, [formId]);

  return {
    isDirty,
    touch,
    resetDirty,
    discardVisible,
    requestLeave,
    confirmDiscard,
    cancelDiscard,
    exitForm,
    prepareNavigation,
  };
}
