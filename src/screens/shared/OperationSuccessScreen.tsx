import { NativeStackScreenProps } from '@react-navigation/native-stack';
import LottieView from 'lottie-react-native';
import { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { completeOperationSuccess } from '../../navigation/operationSuccess';
import { requestAppReload } from '../../services/appReloadService';
import {
  ExportFileActionResult,
  openExportedFile,
  shareExportedFile,
} from '../../services/files/paisaTrackFileStorage';
import { BACKUP_COPY } from '../../constants/dialogCopy';
import { useModalStore } from '../../store/useModalStore';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

export type OperationSuccessStackParams = {
  OperationSuccess: {
    title: string;
    message: string;
    listRoute: string;
    confirmLabel?: string;
    secondaryLabel?: string;
    tertiaryLabel?: string;
    reloadApp?: boolean;
    fileName?: string;
    savedPath?: string;
    openFileUri?: string;
    shareUri?: string;
    shareMimeType?: string;
  };
};

type Props = NativeStackScreenProps<
  OperationSuccessStackParams,
  'OperationSuccess'
>;

export function OperationSuccessScreen({ navigation, route }: Props) {
  const {
    title,
    message,
    listRoute,
    confirmLabel = 'Continue',
    secondaryLabel,
    tertiaryLabel,
    reloadApp = false,
    fileName,
    savedPath,
    openFileUri,
    shareUri,
    shareMimeType,
  } = route.params;
  const insets = useSafeAreaInsets();
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentScale = useRef(new Animated.Value(0.92)).current;

  const handleContinue = useCallback(() => {
    if (reloadApp) {
      requestAppReload();
      return;
    }

    completeOperationSuccess(navigation, listRoute);
  }, [listRoute, navigation, reloadApp]);

  const showError = useModalStore((state) => state.showError);

  const showExportActionError = useCallback(
    (result: ExportFileActionResult) => {
      if (result.ok) return;

      switch (result.reason) {
        case 'missing_uri':
        case 'not_found':
          showError(BACKUP_COPY.exportFileNotFound.title, BACKUP_COPY.exportFileNotFound.message);
          break;
        case 'no_app':
        case 'open_failed':
          showError(BACKUP_COPY.unableToOpenFile.title, BACKUP_COPY.unableToOpenFile.message);
          break;
        case 'sharing_unavailable':
          showError(BACKUP_COPY.sharingUnavailable.title, BACKUP_COPY.sharingUnavailable.message);
          break;
        case 'share_failed':
          showError(BACKUP_COPY.shareFailed.title, BACKUP_COPY.shareFailed.message);
          break;
      }
    },
    [showError],
  );

  const handleOpenFile = useCallback(async () => {
    if (!openFileUri || !shareMimeType) {
      showError(BACKUP_COPY.exportFileNotFound.title, BACKUP_COPY.exportFileNotFound.message);
      return;
    }

    const result = await openExportedFile(openFileUri, shareMimeType, fileName);
    showExportActionError(result);
  }, [fileName, openFileUri, shareMimeType, showError, showExportActionError]);

  const handleShare = useCallback(async () => {
    if (!shareUri || !shareMimeType) {
      showError(BACKUP_COPY.exportFileNotFound.title, BACKUP_COPY.exportFileNotFound.message);
      return;
    }

    const result = await shareExportedFile(
      shareUri,
      shareMimeType,
      secondaryLabel ?? 'Share File',
      fileName,
    );
    showExportActionError(result);
  }, [fileName, secondaryLabel, shareMimeType, shareUri, showError, showExportActionError]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.spring(contentScale, {
        toValue: 1,
        damping: 14,
        stiffness: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [contentOpacity, contentScale]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      handleContinue();
      return true;
    });

    return () => subscription.remove();
  }, [handleContinue]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: contentOpacity,
            transform: [{ scale: contentScale }],
          },
        ]}
      >
        <View style={styles.animationWrap}>
          <LottieView
            source={require('../../../assets/animations/success-checkmark.json')}
            autoPlay
            loop={false}
            style={styles.lottie}
          />
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>

        {fileName || savedPath ? (
          <View style={styles.fileCard}>
            {fileName ? (
              <View style={styles.fileRow}>
                <Text style={styles.fileLabel}>File Name</Text>
                <Text style={styles.fileValue}>{fileName}</Text>
              </View>
            ) : null}
            {savedPath ? (
              <View style={styles.fileRow}>
                <Text style={styles.fileLabel}>File Location</Text>
                <Text style={styles.fileValue}>{savedPath}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {openFileUri && tertiaryLabel ? (
          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
            onPress={handleOpenFile}
          >
            <Text style={styles.secondaryButtonText}>{tertiaryLabel}</Text>
          </Pressable>
        ) : null}

        {shareUri && secondaryLabel ? (
          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
            onPress={handleShare}
          >
            <Text style={styles.secondaryButtonText}>{secondaryLabel}</Text>
          </Pressable>
        ) : null}

        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={handleContinue}
        >
          <Text style={styles.buttonText}>{confirmLabel}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  animationWrap: {
    width: 220,
    height: 220,
    marginBottom: spacing.md,
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    maxWidth: 320,
  },
  fileCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  fileRow: {
    gap: 2,
  },
  fileLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  fileValue: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
    fontWeight: '600',
  },
  secondaryButton: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  button: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
