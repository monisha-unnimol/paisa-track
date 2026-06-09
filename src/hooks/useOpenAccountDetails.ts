import { NavigationProp, ParamListBase, useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';
import { navigateToAccountDetails } from '../navigation/accountDetailsNavigation';
import { usePinGate } from './usePinGate';

export function useOpenAccountDetails(
  navigation?: NavigationProp<ParamListBase>,
) {
  const defaultNavigation = useNavigation<NavigationProp<ParamListBase>>();
  const nav = navigation ?? defaultNavigation;
  const { requestAccess, pinModal, balanceVisibilityVerified } = usePinGate();

  const openAccountDetails = useCallback(
    (accountId: string) => {
      requestAccess(() => navigateToAccountDetails(nav, accountId));
    },
    [nav, requestAccess],
  );

  return { openAccountDetails, pinModal, balanceVisibilityVerified };
}
