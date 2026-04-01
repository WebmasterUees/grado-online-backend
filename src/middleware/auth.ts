import { NextFunction, Request, Response } from 'express';

export const requireAdminApiKey = (req: Request, res: Response, next: NextFunction): void => {
  const configuredApiKey = process.env.ADMIN_API_KEY;

  if (!configuredApiKey || configuredApiKey.trim() === '') {
    res.status(503).json({
      success: false,
      message: 'ADMIN_API_KEY is not configured',
    });
    return;
  }

  const providedApiKey = req.header('x-admin-api-key');

  if (!providedApiKey || providedApiKey !== configuredApiKey) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
    return;
  }

  next();
};
