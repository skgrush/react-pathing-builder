export class GeometryError extends Error {
  constructor(message?: string) {
    super(message)
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class UniquenessError extends Error {
  constructor(message?: string) {
    super(message)
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class ChangeError extends Error {
  constructor(message?: string) {
    super(message)
    Object.setPrototypeOf(this, new.target.prototype)
  }

  static assertNever(C: never, message: string): never {
    console.error('Change Error on:', C)
    throw new ChangeError(message)
  }
}
