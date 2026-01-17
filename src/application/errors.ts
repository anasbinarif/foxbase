export class ValidationError extends Error {
  readonly name = 'ValidationError';
}

export class NotFoundError extends Error {
  readonly name = 'NotFoundError';
}
