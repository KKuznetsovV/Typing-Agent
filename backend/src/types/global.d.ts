// Augment Express Request with JWT payload set by the authenticate middleware
declare global {
  namespace Express {
    interface Request {
      jwtPayload?: {
        userId: string;
        username: string;
      };
    }
  }
}

export {};
