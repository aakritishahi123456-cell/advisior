import { Router, Request, Response } from 'express';
import { copilotService } from '../../services/copilotService';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.post('/chat', authenticate, async (req: Request, res: Response) => {
  try {
    const { message, conversationId } = req.body;
    const userId = (req as any).user?.id;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const context = {
      userId,
      subscriptionPlan: (req as any).user?.subscriptionPlan || 'FREE',
      portfolioIds: (req as any).user?.portfolioIds || [],
      watchlist: (req as any).user?.watchlist || [],
      preferences: {
        riskTolerance: 'moderate' as const,
        investmentHorizon: 'medium' as const,
        notificationSettings: {
          portfolioAlerts: true,
          marketNews: true,
          priceAlerts: true,
          researchUpdates: true,
          frequency: 'daily' as const,
        },
      },
    };

    const response = await copilotService.processMessage(userId, message, context);

    res.json({
      success: true,
      response,
      conversationId,
    });
  } catch (error) {
    console.error('Copilot chat error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

router.post('/conversations', authenticate, async (req: Request, res: Response) => {
  try {
    const { title } = req.body;
    const userId = (req as any).user?.id;

    const conversation = await copilotService.createConversation(userId, title);

    res.json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

router.get('/conversations/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const conversation = await copilotService.getConversation(id);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (conversation.userId !== (req as any).user?.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Failed to get conversation' });
  }
});

router.get('/suggestions', authenticate, async (req: Request, res: Response) => {
  try {
    const suggestions = [
      'Analyze NBL',
      'What is ROE?',
      'How is my portfolio?',
      'Compare NBL vs NMB',
      'What should I invest in?',
      'Show market overview',
      'Analyze banking sector',
      'What is the financial health of NMB?',
    ];

    res.json({
      success: true,
      suggestions,
    });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

router.get('/intents', (req: Request, res: Response) => {
  const { COPILOT_INTENTS } = require('../../services/copilotTypes');
  
  res.json({
    success: true,
    intents: COPILOT_INTENTS.map((intent: any) => ({
      name: intent.name,
      description: intent.description,
      tier: intent.tier,
    })),
  });
});

export default router;
