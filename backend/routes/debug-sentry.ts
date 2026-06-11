import { Router, type Request, type Response, type NextFunction } from "express";

const router = Router();

/**
 * GET /api/debug-sentry?secret=...
 *
 * Guarded verification endpoint. Throws a test error ONLY when the `secret`
 * query param matches `process.env.DEBUG_SENTRY_SECRET`. The thrown error
 * propagates to the Sentry Express error handler (registered in index.ts),
 * which reports it to Sentry, confirming the integration end-to-end.
 *
 * Returns 404 for any non-matching / missing secret so the route is
 * effectively invisible in production.
 */
router.get("/", (req: Request, _res: Response, next: NextFunction) => {
  const expected = process.env.DEBUG_SENTRY_SECRET;
  const provided = req.query.secret;

  if (!expected || provided !== expected) {
    // Behave like an unknown route — do not reveal that this endpoint exists.
    return next();
  }

  throw new Error(
    "[debug-sentry] Test error thrown to verify Sentry backend integration.",
  );
});

export default router;
