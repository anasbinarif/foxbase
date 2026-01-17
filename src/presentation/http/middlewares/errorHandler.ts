import type { NextFunction, Request, Response } from 'express';
import { logger } from '../../../config/logger';
import { NotFoundError, ValidationError } from '../../../application/errors';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ValidationError) {
    res.status(400).json({ error: 'validation_error', message: err.message });
    return;
  }

  if (err instanceof NotFoundError) {
    res.status(404).json({ error: 'not_found', message: err.message });
    return;
  }

  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ error: 'internal_error', message: 'Unexpected server error' });
}
