jest.mock('../../middleware/auth.middleware', () => ({
  requireAuth: (_req: any, _res: any, next: any) => next(),
}));

jest.mock('../../middleware/validation.middleware', () => ({
  validateRequest: () => (_req: any, _res: any, next: any) => next(),
}));

jest.mock('../../middleware/rateLimiter.middleware', () => ({
  generalLimiter: (_req: any, _res: any, next: any) => next(),
  proLimiter: (_req: any, _res: any, next: any) => next(),
}));

jest.mock('../../controllers/reportParser.controller', () => ({
  ReportParserController: {
    parseReportFromURL: jest.fn(),
    uploadAndParseReport: jest.fn(),
    getJobStatus: jest.fn(),
    getParsingHistory: jest.fn(),
    getFinancialReports: jest.fn(),
    getFinancialSummary: jest.fn(),
    deleteFinancialReport: jest.fn(),
    updateFinancialReport: jest.fn(),
    getParsingStatistics: jest.fn(),
  },
  upload: {
    single: jest.fn(() => (_req: any, _res: any, next: any) => next()),
  },
}));

import router from '../reportParser.routes';

describe('report parser routes', () => {
  test('registers /statistics before the symbol route', () => {
    const routePaths = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => layer.route.path);

    expect(routePaths).toContain('/statistics');
    expect(routePaths.indexOf('/statistics')).toBeLessThan(routePaths.indexOf('/:symbol'));
  });
});
