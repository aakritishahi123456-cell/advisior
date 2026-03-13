/**
 * Minimal API key middleware.
 * - If API_KEY is unset, middleware is a no-op (dev-friendly).
 * - In production, set API_KEY and require clients to send:
 *   - `X-API-Key: <key>` OR `Authorization: Bearer <key>`
 */
function apiKeyAuth(req, res, next) {
  const expected = process.env.API_KEY;
  if (!expected) return next();

  const header = req.header('x-api-key') || req.header('authorization') || '';
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7) : header;

  if (token !== expected) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  return next();
}

module.exports = { apiKeyAuth };

