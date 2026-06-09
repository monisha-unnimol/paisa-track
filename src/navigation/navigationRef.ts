import { createNavigationContainerRef } from '@react-navigation/native';
import { databaseService } from '../database';
import { TabParamList } from './TabNavigator';

export const navigationRef = createNavigationContainerRef<TabParamList>();

export function navigateToSmsDraft(draftId: string): void {
  if (!navigationRef.isReady()) {
    return;
  }

  void databaseService.findPendingReviewByDraftId(draftId).then((review) => {
    if (!navigationRef.isReady()) {
      return;
    }

    navigationRef.navigate('Statements', {
      screen: 'TransactionForm',
      params: {
        smsDraftId: draftId,
        reviewId: review?.id,
      },
    });
  });
}
