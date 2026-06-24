type ReloadListener = () => void;

const listeners = new Set<ReloadListener>();

export function requestAppReload(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeAppReload(listener: ReloadListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
