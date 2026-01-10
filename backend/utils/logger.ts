export const logger = {
  info: (msg: string, ...args: any[]) => console.log(`[INFO] ${msg}`, ...args),
  warn: (msg: string, ...args: any[]) => console.warn(`[WARN] ${msg}`, ...args),
  error: (msg: string, ...args: any[]) =>
    console.error(`[ERROR] ${msg}`, ...args),
  debug: (msg: string, ...args: any[]) =>
    process.env.NODE_ENV !== "production" &&
    console.debug(`[DEBUG] ${msg}`, ...args),
  withContext: (context: string) => ({
    info: (msg: string, ...args: any[]) =>
      console.log(`[INFO] [${context}] ${msg}`, ...args),
    warn: (msg: string, ...args: any[]) =>
      console.warn(`[WARN] [${context}] ${msg}`, ...args),
    error: (msg: string, ...args: any[]) =>
      console.error(`[ERROR] [${context}] ${msg}`, ...args),
    debug: (msg: string, ...args: any[]) =>
      process.env.NODE_ENV !== "production" &&
      console.debug(`[DEBUG] [${context}] ${msg}`, ...args),
  }),
};
