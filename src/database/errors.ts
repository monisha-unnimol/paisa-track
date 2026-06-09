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
