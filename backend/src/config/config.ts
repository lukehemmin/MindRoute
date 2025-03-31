import dotenv from 'dotenv';

dotenv.config();

interface Config {
  environment: string;
  port: number;
  database: {
    url: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  encryption: {
    key: string;
    iv: string;
  };
  cors: {
    origin: string;
  };
}

const config: Config = {
  environment: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/mindroute?schema=public',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'mindroute_dev_jwt_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  encryption: {
    key: process.env.ENCRYPTION_KEY || 'mindroute_dev_encryption_key_32char',
    iv: process.env.ENCRYPTION_IV || 'mindroute_dev_iv',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
};

export default config;
