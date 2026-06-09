import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Keyboard, StyleSheet, Text, TextInput, View } from 'react-native';
import { AvatarPicker } from '../../components/AvatarPicker';
import { OnboardingScreen } from '../../components/OnboardingScreen';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenHeader } from '../../components/ScreenHeader';
import { VALIDATION_COPY } from '../../constants/dialogCopy';
import { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';
import { useUserProfileStore } from '../../store/useUserProfileStore';
import { useModalStore } from '../../store/useModalStore';
import { colors } from '../../theme/colors';
import { formStyles } from '../../theme/formStyles';
import { spacing } from '../../theme/spacing';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'ProfileSetup'>;

export function ProfileSetupScreen({ navigation }: Props) {
  const saveProfile = useUserProfileStore((state) => state.saveProfile);
  const showError = useModalStore((state) => state.showError);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [focused, setFocused] = useState(false);

  const handleContinue = async () => {
    Keyboard.dismiss();
    const trimmedName = name.trim();
    if (!trimmedName) {
      showError(VALIDATION_COPY.profileName.title, VALIDATION_COPY.profileName.message);
      return;
    }

    setSaving(true);
    try {
      await saveProfile({ name: trimmedName, avatar });
      navigation.navigate('PinSetup', { mode: 'onboarding' });
    } catch {
      showError(
        VALIDATION_COPY.profileSaveFailed.title,
        VALIDATION_COPY.profileSaveFailed.message,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <OnboardingScreen
      centerContent
      useStackHeaderOffset={false}
      footer={
        <PrimaryButton
          label={saving ? 'Saving...' : 'Continue'}
          onPress={handleContinue}
          disabled={saving}
          loading={saving}
          compact
        />
      }
    >
      <View style={styles.content}>
        <ScreenHeader
          align="center"
          title="Profile Setup"
          subtitle="Tell us a little about yourself"
        />

        <AvatarPicker variant="centered" name={name} avatar={avatar} onChange={setAvatar} />

        <View style={styles.nameSection}>
          <Text style={formStyles.label}>Name</Text>
          <TextInput
            style={[formStyles.input, focused && formStyles.inputFocused]}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor={colors.textMuted}
            autoCorrect={false}
            returnKeyType="done"
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onSubmitEditing={handleContinue}
          />
        </View>
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    gap: spacing.lg,
    alignSelf: 'stretch',
    width: '100%',
  },
  nameSection: {
    gap: spacing.sm,
    alignSelf: 'stretch',
  },
});
