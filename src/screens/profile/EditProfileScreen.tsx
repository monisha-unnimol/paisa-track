import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AvatarPicker } from '../../components/AvatarPicker';
import { Card } from '../../components/Card';
import { FormScreenContainer } from '../../components/FormScreenContainer';
import { VALIDATION_COPY } from '../../constants/dialogCopy';
import { HomeStackParamList } from '../../navigation/HomeStackNavigator';
import { navigateToOperationSuccess } from '../../navigation/operationSuccess';
import { databaseService } from '../../database';
import { useUserProfileStore } from '../../store/useUserProfileStore';
import { useModalStore } from '../../store/useModalStore';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

type Props = NativeStackScreenProps<HomeStackParamList, 'EditProfile'>;

export function EditProfileScreen({ navigation, route }: Props) {
  const returnRoute = route.params?.returnRoute ?? 'HomeMain';
  const saveProfile = useUserProfileStore((state) => state.saveProfile);
  const showError = useModalStore((state) => state.showError);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    databaseService
      .getUserProfile()
      .then((profile) => {
        if (profile) {
          setName(profile.name);
          setAvatar(profile.avatar);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      showError(VALIDATION_COPY.profileName.title, VALIDATION_COPY.profileName.message);
      return;
    }

    setSaving(true);
    try {
      await saveProfile({ name: trimmedName, avatar });
      navigateToOperationSuccess(navigation, {
        title: 'Profile Updated',
        message: 'Your profile has been updated successfully.',
        listRoute: returnRoute,
      });
    } catch {
      showError(
        VALIDATION_COPY.profileSaveFailed.title,
        VALIDATION_COPY.profileSaveFailed.message,
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <FormScreenContainer contentContainerStyle={styles.loaderContent}>
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      </FormScreenContainer>
    );
  }

  return (
    <FormScreenContainer>
      <Card style={styles.section}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter your name"
          placeholderTextColor={colors.textMuted}
          autoCorrect={false}
        />
      </Card>

      <Card style={styles.section}>
        <AvatarPicker name={name} avatar={avatar} onChange={setAvatar} />
      </Card>

      <Pressable
        style={[styles.button, saving && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.buttonText}>{saving ? 'Saving...' : 'Save Profile'}</Text>
      </Pressable>
    </FormScreenContainer>
  );
}

const styles = StyleSheet.create({
  loaderContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  loader: {
    marginTop: spacing.xl,
  },
  section: {
    gap: spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
