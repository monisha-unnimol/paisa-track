import { useCallback, useEffect, useState } from 'react';
import { useUnsavedChangesStore } from '../store/useUnsavedChangesStore';

export function useFormEditingGuard(formId: string, formLabel: string) {
  const [isDirty, setIsDirty] = useState(false);
  const register = useUnsavedChangesStore((state) => state.register);
  const unregister = useUnsavedChangesStore((state) => state.unregister);

  const touch = useCallback(() => setIsDirty(true), []);
  const resetDirty = useCallback(() => setIsDirty(false), []);

  useEffect(() => {
    if (isDirty) {
      register(formId, formLabel);
    } else {
      unregister(formId);
    }

    return () => unregister(formId);
  }, [formId, formLabel, isDirty, register, unregister]);

  return { isDirty, touch, resetDirty };
}
