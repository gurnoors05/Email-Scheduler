import { Request, Response, NextFunction } from 'express';

export const basicAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
  const [user, password] = Buffer.from(b64auth, 'base64').toString().split(':');

  const adminUser = process.env.ADMIN_DASHBOARD_USER || 'admin';
  const adminPass = process.env.ADMIN_DASHBOARD_PASS || 'changeme123';

  if (user && password && user === adminUser && password === adminPass) {
    return next();
  }

  res.set('WWW-Authenticate', 'Basic realm="Admin"');
  return res.status(401).send('Authentication required.');
};
