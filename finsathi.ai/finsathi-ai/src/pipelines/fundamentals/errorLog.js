const fs = require('fs');
const path = require('path');

function appendJsonLine({ filePath, record }) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(filePath, `${JSON.stringify(record)}\n`, 'utf8');
}

function logScraperError({ logger, err, context }) {
  const record = {
    ts: new Date().toISOString(),
    context: context || {},
    error: {
      message: err?.message || String(err),
      code: err?.code,
      status: err?.response?.status,
      url: err?.config?.url,
      stack: err?.stack,
    },
  };

  if (logger?.error) logger.error({ ...record.context, err: record.error.message }, 'Fundamentals scrape error');

  const filePath =
    process.env.FUNDAMENTALS_ERROR_LOG ||
    path.join(process.cwd(), 'logs', 'fundamentals-scraper-errors.log');
  appendJsonLine({ filePath, record });
}

module.exports = { logScraperError };

