declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
      user?: {
        id: string;
        username?: string;
        email?: string;
        role?: string;
      };
    }
  }
}

export {};
