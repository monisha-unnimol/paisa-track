import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import {
  disableSmsTracking,
  enableSmsTracking,
} from '../services/sms/smsTrackingService';

const SMS_AUTO_TRACKING_KEY = '@paisatrack/smsAutoTrackingEnabled';

type SettingsStore = {
  smsAutoTrackingEnabled: boolean;
  hydrated: boolean;
  loadSettings: () => Promise<void>;
  setSmsAutoTrackingEnabled: (
    enabled: boolean,
  ) => Promise<'enabled' | 'disabled' | 'denied' | 'blocked' | 'unavailable'>;
};

async function readSmsAutoTrackingFlag(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(SMS_AUTO_TRACKING_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

async function writeSmsAutoTrackingFlag(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(SMS_AUTO_TRACKING_KEY, enabled ? 'true' : 'false');
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  smsAutoTrackingEnabled: false,
  hydrated: false,

  loadSettings: async () => {
    const smsAutoTrackingEnabled = await readSmsAutoTrackingFlag();
    set({ smsAutoTrackingEnabled, hydrated: true });
  },

  setSmsAutoTrackingEnabled: async (enabled) => {
    if (enabled) {
      const result = await enableSmsTracking();
      if (result !== 'enabled') {
        await writeSmsAutoTrackingFlag(false);
        set({ smsAutoTrackingEnabled: false });
        return result;
      }

      await writeSmsAutoTrackingFlag(true);
      set({ smsAutoTrackingEnabled: true });
      return 'enabled';
    }

    await disableSmsTracking();
    await writeSmsAutoTrackingFlag(false);
    set({ smsAutoTrackingEnabled: false });
    return 'disabled';
  },
}));
