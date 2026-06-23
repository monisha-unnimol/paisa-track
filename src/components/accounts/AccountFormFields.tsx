import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { Pressable, StyleProp, Text, TextInput, View, ViewStyle } from 'react-native';
import {
  ACCOUNT_COLORS,
  ACCOUNT_ICONS,
  ACCOUNT_TYPE_LABELS,
  ACCOUNT_TYPES,
} from '../../constants/accountOptions';
import { AccountType } from '../../database/types';
import { AppSwitch } from '../AppSwitch';
import { Card } from '../Card';
import { CurrencyInput } from '../CurrencyInput';
import { colors } from '../../theme/colors';
import { accountFormStyles as styles } from './accountFormStyles';

export type AccountFormValues = {
  name: string;
  type: AccountType;
  balance: string;
  icon: string;
  color: string;
  isDefault: boolean;
};

type AccountFormFieldsProps = {
  values: AccountFormValues;
  onNameChange: (value: string) => void;
  onTypeChange: (value: AccountType) => void;
  onBalanceChange: (value: string) => void;
  onIconChange: (value: string) => void;
  onColorChange: (value: string) => void;
  onDefaultChange: (value: boolean) => void;
  onTouch?: () => void;
  showDefaultSwitch?: boolean;
  balanceLabel?: string;
  balanceHint?: string;
  namePlaceholder?: string;
  afterBalance?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function AccountFormFields({
  values,
  onNameChange,
  onTypeChange,
  onBalanceChange,
  onIconChange,
  onColorChange,
  onDefaultChange,
  onTouch,
  showDefaultSwitch = true,
  balanceLabel = 'Balance (₹)',
  balanceHint = 'Update this anytime to reflect your current account balance.',
  namePlaceholder = 'e.g. HDFC Savings',
  afterBalance,
  style,
}: AccountFormFieldsProps) {
  const touch = onTouch ?? (() => undefined);

  return (
    <View style={[styles.content, style]}>
      <Card style={styles.section}>
        <Text style={styles.label}>Account Name</Text>
        <TextInput
          style={styles.input}
          value={values.name}
          onChangeText={(value) => {
            touch();
            onNameChange(value);
          }}
          placeholder={namePlaceholder}
          placeholderTextColor={colors.textMuted}
        />
      </Card>

      <Card style={styles.section}>
        <Text style={styles.label}>Account Type</Text>
        <View style={styles.typeGrid}>
          {ACCOUNT_TYPES.map((accountType) => {
            const selected = values.type === accountType;
            return (
              <Pressable
                key={accountType}
                style={[styles.typeChip, selected && styles.typeChipSelected]}
                onPress={() => {
                  touch();
                  onTypeChange(accountType);
                }}
              >
                <Text style={[styles.typeChipText, selected && styles.typeChipTextSelected]}>
                  {ACCOUNT_TYPE_LABELS[accountType]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.label}>{balanceLabel}</Text>
        <CurrencyInput
          style={styles.input}
          value={values.balance}
          onChangeValue={(value) => {
            touch();
            onBalanceChange(value);
          }}
          placeholder="0.00"
          placeholderTextColor={colors.textMuted}
        />
        <Text style={styles.hint}>{balanceHint}</Text>
      </Card>

      {afterBalance}

      <Card style={styles.section}>
        <Text style={styles.label}>Icon</Text>
        <View style={styles.iconGrid}>
          {ACCOUNT_ICONS.map((item) => {
            const selected = values.icon === item;
            return (
              <Pressable
                key={item}
                style={[
                  styles.iconOption,
                  selected && { borderColor: values.color, backgroundColor: `${values.color}15` },
                ]}
                onPress={() => {
                  touch();
                  onIconChange(item);
                }}
              >
                <Text style={styles.iconEmoji}>{item}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.label}>Color</Text>
        <View style={styles.colorGrid}>
          {ACCOUNT_COLORS.map((item) => {
            const selected = values.color === item;
            return (
              <Pressable
                key={item}
                style={[
                  styles.colorOption,
                  { backgroundColor: item },
                  selected && styles.colorOptionSelected,
                ]}
                onPress={() => {
                  touch();
                  onColorChange(item);
                }}
              >
                {selected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
              </Pressable>
            );
          })}
        </View>
      </Card>

      {showDefaultSwitch ? (
        <Card style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>Default Account</Text>
            <Text style={styles.switchHint}>Used for new transactions</Text>
          </View>
          <AppSwitch
            value={values.isDefault}
            onValueChange={onDefaultChange}
            accessibilityLabel="Default account"
          />
        </Card>
      ) : null}
    </View>
  );
}
