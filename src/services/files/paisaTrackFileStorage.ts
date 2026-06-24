import { Linking, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';

const { StorageAccessFramework } = FileSystem;

export type UserExportInput = {
  fileName: string;
  mimeType: string;
  textContents?: string;
  sourceFileUri?: string;
};

export type UserExportResult =
  | { ok: true; fileUri: string; shareableUri: string; fileName: string; displayPath: string }
  | {
      ok: false;
      reason: 'cancelled' | 'permission_denied' | 'write_failed' | 'verify_failed' | 'read_failed';
    };

export type ExportFileActionResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | 'missing_uri'
        | 'not_found'
        | 'no_app'
        | 'open_failed'
        | 'sharing_unavailable'
        | 'share_failed';
    };

function splitFileName(fileName: string): { baseName: string } {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot <= 0) {
    return { baseName: fileName };
  }

  return { baseName: fileName.slice(0, lastDot) };
}

function parseSafDirectoryDisplayPath(directoryUri: string, fileName: string): string {
  const match = directoryUri.match(/primary:([^/]+)/);
  const folder = match?.[1] ?? 'Selected folder';
  return `${folder}/${fileName}`;
}

async function verifyFileWritten(fileUri: string): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(fileUri);
    console.log('[Export] File existence check:', fileUri, info);
    return info.exists && (info.size ?? 1) > 0;
  } catch (error) {
    console.error('[Export] File existence check failed:', fileUri, error);
    return false;
  }
}

export async function verifyExportFileExists(fileUri: string): Promise<boolean> {
  return verifyFileWritten(fileUri);
}

async function ensureExportCacheDirectory(): Promise<string> {
  const base = FileSystem.cacheDirectory;
  if (!base) {
    throw new Error('Cache unavailable');
  }

  const directory = `${base}exports/`;
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  return directory;
}

async function writeShareableCopy(input: UserExportInput): Promise<string> {
  const directory = await ensureExportCacheDirectory();
  const shareableUri = `${directory}${input.fileName}`;

  if (input.textContents !== undefined) {
    await FileSystem.writeAsStringAsync(shareableUri, input.textContents, {
      encoding: FileSystem.EncodingType.UTF8,
    });
  } else if (input.sourceFileUri) {
    await FileSystem.copyAsync({ from: input.sourceFileUri, to: shareableUri });
  } else {
    throw new Error('No export contents available for shareable copy');
  }

  console.log('[Export] Shareable copy written:', shareableUri);
  return shareableUri;
}

async function resolveShareableFileUri(
  fileUri: string,
  fileName: string,
  mimeType: string,
): Promise<string | null> {
  if (fileUri.startsWith('file://')) {
    return fileUri;
  }

  if (!fileUri.startsWith('content://')) {
    console.warn('[Export] Unsupported URI scheme:', fileUri);
    return null;
  }

  console.log('[Export] Resolving content URI to shareable copy:', fileUri);

  try {
    const directory = await ensureExportCacheDirectory();
    const shareableUri = `${directory}${fileName}`;

    if (mimeType === 'application/pdf') {
      const base64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      await FileSystem.writeAsStringAsync(shareableUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
    } else {
      const text = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      await FileSystem.writeAsStringAsync(shareableUri, text, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    }

    console.log('[Export] Resolved shareable URI:', shareableUri);
    return shareableUri;
  } catch (error) {
    console.error('[Export] Failed to resolve content URI:', fileUri, error);
    return null;
  }
}

async function ensureIosExportDirectory(): Promise<string> {
  const base = FileSystem.documentDirectory;
  if (!base) {
    throw new Error('Storage unavailable');
  }

  const directory = `${base}PaisaTrack/`;
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  return directory;
}

async function saveToAndroidSaf(input: UserExportInput): Promise<UserExportResult> {
  const shareableUri = await writeShareableCopy(input);
  const { baseName } = splitFileName(input.fileName);
  const initialUri = StorageAccessFramework.getUriForDirectoryInRoot('Download');
  const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync(initialUri);

  if (!permissions.granted) {
    return { ok: false, reason: 'cancelled' };
  }

  const fileUri = await StorageAccessFramework.createFileAsync(
    permissions.directoryUri,
    baseName,
    input.mimeType,
  );

  console.log('[Export] Android SAF file URI:', fileUri);

  if (input.textContents !== undefined) {
    await StorageAccessFramework.writeAsStringAsync(fileUri, input.textContents, {
      encoding: FileSystem.EncodingType.UTF8,
    });
  } else if (input.sourceFileUri) {
    const base64 = await FileSystem.readAsStringAsync(input.sourceFileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    await StorageAccessFramework.writeAsStringAsync(fileUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } else {
    return { ok: false, reason: 'write_failed' };
  }

  const verifiedSaf = await verifyFileWritten(fileUri);
  const verifiedShareable = await verifyFileWritten(shareableUri);
  if (!verifiedSaf || !verifiedShareable) {
    return { ok: false, reason: 'verify_failed' };
  }

  return {
    ok: true,
    fileUri,
    shareableUri,
    fileName: input.fileName,
    displayPath: parseSafDirectoryDisplayPath(permissions.directoryUri, input.fileName),
  };
}

async function saveToIosUserStorage(input: UserExportInput): Promise<UserExportResult> {
  const directory = await ensureIosExportDirectory();
  const fileUri = `${directory}${input.fileName}`;

  if (input.textContents !== undefined) {
    await FileSystem.writeAsStringAsync(fileUri, input.textContents, {
      encoding: FileSystem.EncodingType.UTF8,
    });
  } else if (input.sourceFileUri) {
    await FileSystem.copyAsync({ from: input.sourceFileUri, to: fileUri });
  } else {
    return { ok: false, reason: 'write_failed' };
  }

  const verified = await verifyFileWritten(fileUri);
  if (!verified) {
    return { ok: false, reason: 'verify_failed' };
  }

  console.log('[Export] iOS file URI:', fileUri);

  return {
    ok: true,
    fileUri,
    shareableUri: fileUri,
    fileName: input.fileName,
    displayPath: `Files/PaisaTrack/${input.fileName}`,
  };
}

export async function exportFileToUserStorage(input: UserExportInput): Promise<UserExportResult> {
  try {
    if (Platform.OS === 'android') {
      return await saveToAndroidSaf(input);
    }

    return await saveToIosUserStorage(input);
  } catch (error) {
    console.error('[Export] Save failed', error);
    return { ok: false, reason: 'write_failed' };
  }
}

function getShareUti(mimeType: string): string {
  return mimeType === 'application/pdf' ? 'com.adobe.pdf' : 'public.json';
}

export async function openExportedFile(
  fileUri: string,
  mimeType: string,
  fileName?: string,
): Promise<ExportFileActionResult> {
  console.log('[Export] Open action URI:', fileUri, 'mime:', mimeType);

  if (!fileUri) {
    return { ok: false, reason: 'missing_uri' };
  }

  const resolvedUri =
    fileUri.startsWith('file://') || !fileName
      ? fileUri
      : await resolveShareableFileUri(fileUri, fileName, mimeType);

  if (!resolvedUri) {
    return { ok: false, reason: 'not_found' };
  }

  const exists = await verifyExportFileExists(resolvedUri);
  if (!exists) {
    return { ok: false, reason: 'not_found' };
  }

  try {
    if (Platform.OS === 'android') {
      const contentUri = await FileSystem.getContentUriAsync(resolvedUri);
      console.log('[Export] Android content URI for open:', contentUri);

      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: contentUri,
        flags: 1,
        type: mimeType,
      });

      return { ok: true };
    }

    const canOpen = await Linking.canOpenURL(resolvedUri);
    if (canOpen) {
      await Linking.openURL(resolvedUri);
      return { ok: true };
    }

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(resolvedUri, {
        mimeType,
        UTI: getShareUti(mimeType),
      });
      return { ok: true };
    }

    return { ok: false, reason: 'no_app' };
  } catch (error) {
    console.error('[Export] Open failed:', error);
    return { ok: false, reason: 'no_app' };
  }
}

export async function shareExportedFile(
  fileUri: string,
  mimeType: string,
  dialogTitle: string,
  fileName?: string,
): Promise<ExportFileActionResult> {
  console.log('[Export] Share action URI:', fileUri, 'mime:', mimeType);

  if (!fileUri) {
    return { ok: false, reason: 'missing_uri' };
  }

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    return { ok: false, reason: 'sharing_unavailable' };
  }

  const resolvedUri =
    fileUri.startsWith('file://') || !fileName
      ? fileUri
      : await resolveShareableFileUri(fileUri, fileName, mimeType);

  if (!resolvedUri) {
    return { ok: false, reason: 'not_found' };
  }

  const exists = await verifyExportFileExists(resolvedUri);
  if (!exists) {
    return { ok: false, reason: 'not_found' };
  }

  try {
    await Sharing.shareAsync(resolvedUri, {
      mimeType,
      dialogTitle,
      UTI: getShareUti(mimeType),
    });

    return { ok: true };
  } catch (error) {
    console.error('[Export] Share failed:', error);
    return { ok: false, reason: 'share_failed' };
  }
}
