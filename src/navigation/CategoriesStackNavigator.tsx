import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { CategoriesScreen } from '../screens/categories/CategoriesScreen';
import { CategoryFormScreen } from '../screens/categories/CategoryFormScreen';
import { OperationSuccessScreen } from '../screens/shared/OperationSuccessScreen';
import { CategoryFormParams } from './categoryFormParams';
import { useTabStackResetOnBlur } from '../hooks/useTabStackResetOnBlur';
import { OperationSuccessParams } from '../navigation/operationSuccess';
import { formScreenOptions, stackScreenOptions, successScreenOptions } from './stackScreenOptions';

export type CategoriesStackParamList = {
  CategoriesList: undefined;
  CategoryForm: CategoryFormParams;
  OperationSuccess: OperationSuccessParams;
};

const Stack = createNativeStackNavigator<CategoriesStackParamList>();

function CategoriesStackNavigatorInner() {
  const navigation = useNavigation();
  useTabStackResetOnBlur(
    navigation as NavigationProp<ParamListBase>,
    'CategoriesList',
    'Categories',
  );

  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen
        name="CategoriesList"
        component={CategoriesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CategoryForm"
        component={CategoryFormScreen}
        options={({ route }) => ({
          ...formScreenOptions,
          title: route.params.categoryId ? 'Edit Spending Limit' : 'Add Spending Limit',
          headerBackVisible: false,
        })}
      />
      <Stack.Screen
        name="OperationSuccess"
        component={OperationSuccessScreen}
        options={successScreenOptions}
      />
    </Stack.Navigator>
  );
}

export function CategoriesStackNavigator() {
  return <CategoriesStackNavigatorInner />;
}
