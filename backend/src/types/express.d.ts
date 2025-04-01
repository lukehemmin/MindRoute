import { UserAttributes } from '../models/user.model';

declare global {
  namespace Express {
    interface Request {
      user?: UserAttributes;
      uploadedFiles?: Array<{
        originalName: string;
        filename: string;
        path: string;
        size: number;
        mimetype: string;
      }>;
    }
  }
} 