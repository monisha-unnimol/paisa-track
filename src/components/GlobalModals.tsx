import { ErrorModal } from './ErrorModal';
import { useModalStore } from '../store/useModalStore';

export function GlobalModals() {
  const error = useModalStore((state) => state.error);
  const onRetry = useModalStore((state) => state.onRetry);
  const clearError = useModalStore((state) => state.clearError);

  return (
    <ErrorModal
      visible={error !== null}
      title={error?.title ?? ''}
      message={error?.message ?? ''}
      onDismiss={clearError}
      onRetry={onRetry}
    />
  );
}
