import { create } from 'zustand';

type UnsavedEntry = {
  label: string;
};

type UnsavedChangesStore = {
  entries: Record<string, UnsavedEntry>;
  navigationBypass: boolean;
  register: (id: string, label: string) => void;
  unregister: (id: string) => void;
  hasUnsaved: () => boolean;
  enableNavigationBypass: () => void;
  disableNavigationBypass: () => void;
  clearAll: () => void;
};

export const useUnsavedChangesStore = create<UnsavedChangesStore>((set, get) => ({
  entries: {},
  navigationBypass: false,
  register: (id, label) =>
    set((state) => ({
      entries: { ...state.entries, [id]: { label } },
    })),
  unregister: (id) =>
    set((state) => {
      if (!state.entries[id]) return state;
      const next = { ...state.entries };
      delete next[id];
      return { entries: next };
    }),
  hasUnsaved: () => Object.keys(get().entries).length > 0,
  enableNavigationBypass: () => set({ navigationBypass: true }),
  disableNavigationBypass: () => set({ navigationBypass: false }),
  clearAll: () => set({ entries: {} }),
}));
