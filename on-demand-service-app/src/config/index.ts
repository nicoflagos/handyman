import dotenv from 'dotenv';

dotenv.config();

const config = {
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/on_demand_service',
  jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30m',
  authCookieName: process.env.AUTH_COOKIE_NAME || 'access_token',
  authCookieDomain: process.env.AUTH_COOKIE_DOMAIN || undefined,
  authCookieSameSite: (process.env.AUTH_COOKIE_SAMESITE || 'lax') as 'lax' | 'strict' | 'none',
  apiUrl: process.env.API_URL || 'http://localhost:3000/api',
};

export default config;
