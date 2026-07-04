export class ApexError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 500
  ) {
    super(message);
    this.name = "ApexError";
  }
}

export class UnauthorizedError extends ApexError {
  constructor(message = "Usuario no autenticado") {
    super("unauthorized", message, 401);
  }
}

export class ForbiddenError extends ApexError {
  constructor(message = "Operacion no permitida") {
    super("forbidden", message, 403);
  }
}

export class ValidationError extends ApexError {
  constructor(message = "Datos invalidos") {
    super("validation_error", message, 400);
  }
}
