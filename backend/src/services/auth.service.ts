import jwt from 'jsonwebtoken';
import { appConfig } from '../config';

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, appConfig.jwt.secret, {
    expiresIn: appConfig.jwt.expiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string): Express.User {
  return jwt.verify(token, appConfig.jwt.secret) as Express.User;
}
