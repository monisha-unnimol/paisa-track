export class CategoryDeleteBlockedError extends Error {
  constructor() {
    super('Category has linked records');
    this.name = 'CategoryDeleteBlockedError';
  }
}

export class CategoryDuplicateNameError extends Error {
  constructor() {
    super('A category with this name already exists');
    this.name = 'CategoryDuplicateNameError';
  }
}

export class CategoryNotFoundError extends Error {
  constructor() {
    super('Category not found');
    this.name = 'CategoryNotFoundError';
  }
}

export class CategorySaveError extends Error {
  cause?: unknown;

  constructor(cause?: unknown) {
    super('Category could not be saved');
    this.name = 'CategorySaveError';
    this.cause = cause;
  }
}

export class InvestmentTypeDuplicateNameError extends Error {
  constructor() {
    super('An investment type with this name already exists');
    this.name = 'InvestmentTypeDuplicateNameError';
  }
}

export class InvestmentTypeSaveError extends Error {
  cause?: unknown;

  constructor(cause?: unknown) {
    super('Investment type could not be saved');
    this.name = 'InvestmentTypeSaveError';
    this.cause = cause;
  }
}

export class InvestmentTypeDeleteBlockedError extends Error {
  constructor() {
    super('Investment type is in use');
    this.name = 'InvestmentTypeDeleteBlockedError';
  }
}

export class InvestmentTypeNotFoundError extends Error {
  constructor() {
    super('Investment type not found');
    this.name = 'InvestmentTypeNotFoundError';
  }
}
