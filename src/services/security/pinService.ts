import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

export type PinLength = 4 | 6;

const PIN_HASH_KEY = 'paisatrack_pin_hash';
const PIN_SALT_KEY = 'paisatrack_pin_salt';
const PIN_LENGTH_KEY = 'paisatrack_pin_length';
const PIN_CONFIGURED_KEY = 'paisatrack_pin_configured';

async function hashPin(pin: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${pin}`,
  );
}

function generateSalt(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function isPinConfigured(): Promise<boolean> {
  try {
    const configured = await SecureStore.getItemAsync(PIN_CONFIGURED_KEY);
    return configured === 'true';
  } catch {
    return false;
  }
}

export async function getStoredPinLength(): Promise<PinLength | null> {
  try {
    const length = await SecureStore.getItemAsync(PIN_LENGTH_KEY);
    if (length === '4' || length === '6') {
      return Number(length) as PinLength;
    }
    return null;
  } catch {
    return null;
  }
}

export async function savePin(pin: string, length: PinLength): Promise<void> {
  const salt = generateSalt();
  const hash = await hashPin(pin, salt);

  await SecureStore.setItemAsync(PIN_SALT_KEY, salt);
  await SecureStore.setItemAsync(PIN_HASH_KEY, hash);
  await SecureStore.setItemAsync(PIN_LENGTH_KEY, String(length));
  await SecureStore.setItemAsync(PIN_CONFIGURED_KEY, 'true');
}

export async function verifyPin(pin: string): Promise<boolean> {
  try {
    const [salt, storedHash] = await Promise.all([
      SecureStore.getItemAsync(PIN_SALT_KEY),
      SecureStore.getItemAsync(PIN_HASH_KEY),
    ]);

    if (!salt || !storedHash) {
      return false;
    }

    const hash = await hashPin(pin, salt);
    return hash === storedHash;
  } catch {
    return false;
  }
}

export async function changePin(currentPin: string, newPin: string, length: PinLength): Promise<'success' | 'incorrect'> {
  const valid = await verifyPin(currentPin);
  if (!valid) {
    return 'incorrect';
  }

  await savePin(newPin, length);
  return 'success';
}

export function isValidPin(pin: string, length: PinLength): boolean {
  return new RegExp(`^\\d{${length}}$`).test(pin);
}
