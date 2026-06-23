import { databaseService } from '../../database';
import { CreateInvestmentTypeInput, InvestmentTypeDefinition } from '../../database/types';

let cachedTypes: InvestmentTypeDefinition[] | null = null;

export async function loadInvestmentTypeOptions(): Promise<InvestmentTypeDefinition[]> {
  if (cachedTypes) {
    return cachedTypes;
  }

  const types = await databaseService.getInvestmentTypes();
  cachedTypes = types;
  return types;
}

export async function loadUserInvestmentTypes(): Promise<InvestmentTypeDefinition[]> {
  const types = await loadInvestmentTypeOptions();
  return types.filter((type) => !type.isBuiltin);
}

export function clearInvestmentTypeCache(): void {
  cachedTypes = null;
}

export async function createInvestmentType(
  input: CreateInvestmentTypeInput,
): Promise<InvestmentTypeDefinition> {
  const created = await databaseService.createInvestmentType(input);
  clearInvestmentTypeCache();
  return created;
}

export async function deleteInvestmentType(id: string): Promise<boolean> {
  const deleted = await databaseService.deleteInvestmentType(id);
  clearInvestmentTypeCache();
  return deleted;
}
