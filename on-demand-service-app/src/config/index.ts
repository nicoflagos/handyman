import dotenv from 'dotenv';

dotenv.config();

const config = {
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/on_demand_service',
  jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret',
  apiUrl: process.env.API_URL || 'http://localhost:3000/api',
};

export default config;