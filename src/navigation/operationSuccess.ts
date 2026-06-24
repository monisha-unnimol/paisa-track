import { CommonActions, NavigationProp, ParamListBase } from '@react-navigation/native';
import { useUnsavedChangesStore } from '../store/useUnsavedChangesStore';

export type OperationSuccessParams = {
  title: string;
  message: string;
  listRoute: string;
  confirmLabel?: string;
  secondaryLabel?: string;
  tertiaryLabel?: string;
  reloadApp?: boolean;
  fileName?: string;
  savedPath?: string;
  openFileUri?: string;
  shareUri?: string;
  shareMimeType?: string;
};

export function navigateToOperationSuccess(
  navigation: NavigationProp<ParamListBase>,
  params: OperationSuccessParams,
) {
  useUnsavedChangesStore.getState().enableNavigationBypass();
  navigation.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{ name: 'OperationSuccess', params }],
    }),
  );
}

export function completeOperationSuccess(
  navigation: NavigationProp<ParamListBase>,
  listRoute: string,
) {
  navigation.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{ name: listRoute }],
    }),
  );
}
