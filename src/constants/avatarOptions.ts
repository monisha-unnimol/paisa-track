export const PREDEFINED_AVATARS = [
  '😊',
  '🙂',
  '😎',
  '🤩',
  '🥳',
  '😇',
  '🧑',
  '👩',
  '👨',
  '🧑‍💼',
  '👩‍💻',
  '🦊',
  '🐼',
  '🐯',
  '🦁',
  '🐨',
  '🌟',
  '💎',
  '🎯',
  '🚀',
] as const;

export function formatEmojiAvatar(emoji: string): string {
  return `emoji:${emoji}`;
}

export function formatUriAvatar(uri: string): string {
  return `uri:${uri}`;
}

export function parseAvatarValue(avatar: string | null | undefined): {
  type: 'emoji' | 'uri' | 'none';
  value: string | null;
} {
  if (!avatar) return { type: 'none', value: null };
  if (avatar.startsWith('emoji:')) {
    return { type: 'emoji', value: avatar.slice('emoji:'.length) };
  }
  if (avatar.startsWith('uri:')) {
    return { type: 'uri', value: avatar.slice('uri:'.length) };
  }
  if (avatar.startsWith('file://') || avatar.startsWith('content://')) {
    return { type: 'uri', value: avatar };
  }
  return { type: 'emoji', value: avatar };
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
