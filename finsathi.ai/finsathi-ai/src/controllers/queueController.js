const { createQueues, getQueueStats } = require('../queue/queueConfig');

class QueueController {
  static async stats(req, res, next) {
    try {
      const queues = createQueues();
      const out = {
        marketDataQueue: await getQueueStats(queues.marketDataQueue),
        fundamentalsQueue: await getQueueStats(queues.fundamentalsQueue),
        newsQueue: await getQueueStats(queues.newsQueue),
        analysisQueue: await getQueueStats(queues.analysisQueue),
        deadLetterQueue: await getQueueStats(queues.deadLetterQueue),
      };
      res.json({ success: true, data: out });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = { QueueController };

