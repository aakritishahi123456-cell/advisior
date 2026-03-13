const logger = {
  info(meta, msg) {
    if (typeof meta === 'string') return console.log(`[INFO] ${meta}`);
    console.log(`[INFO] ${msg || ''}`, meta || '');
  },
  warn(meta, msg) {
    if (typeof meta === 'string') return console.warn(`[WARN] ${meta}`);
    console.warn(`[WARN] ${msg || ''}`, meta || '');
  },
  error(meta, msg) {
    if (typeof meta === 'string') return console.error(`[ERROR] ${meta}`);
    console.error(`[ERROR] ${msg || ''}`, meta || '');
  },
};

module.exports = { logger };

