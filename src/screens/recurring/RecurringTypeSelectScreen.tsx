import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '../../components/Card';
import { ScreenContainer } from '../../components/ScreenContainer';
import { RecurringStackParamList } from '../../navigation/RecurringStackNavigator';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

type Props = NativeStackScreenProps<RecurringStackParamList, 'RecurringTypeSelect'>;

export function RecurringTypeSelectScreen({ navigation }: Props) {
  return (
    <ScreenContainer omitTopInset>
      <Text style={styles.intro}>Choose what you want to schedule</Text>

      <Pressable
        style={({ pressed }) => [styles.optionCard, pressed && styles.optionPressed]}
        onPress={() => navigation.navigate('InvestmentForm', {})}
      >
        <Card style={styles.optionInner}>
          <View style={[styles.iconWrap, styles.investmentIconWrap]}>
            <Ionicons name="trending-up" size={28} color={colors.income} />
          </View>
          <View style={styles.optionInfo}>
            <Text style={styles.optionTitle}>Investment</Text>
            <Text style={styles.optionText}>
              SIP, mutual funds, stocks, PPF, NPS, FD, RD, crypto, and more
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Card>
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.optionCard, pressed && styles.optionPressed]}
        onPress={() => navigation.navigate('RecurringExpenseForm', {})}
      >
        <Card style={styles.optionInner}>
          <View style={[styles.iconWrap, styles.expenseIconWrap]}>
            <Ionicons name="calendar-outline" size={28} color={colors.warning} />
          </View>
          <View style={styles.optionInfo}>
            <Text style={styles.optionTitle}>Expense</Text>
            <Text style={styles.optionText}>
              Rent, EMI, insurance, electricity, internet, subscriptions, and more
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Card>
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  intro: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  optionCard: { marginBottom: spacing.md },
  optionPressed: { opacity: 0.96 },
  optionInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  investmentIconWrap: { backgroundColor: `${colors.income}15` },
  expenseIconWrap: { backgroundColor: `${colors.warning}15` },
  optionInfo: { flex: 1, gap: 4 },
  optionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  optionText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
