import { Router, Request, Response } from 'express';
import { educationService } from '../../services/educationContent';
import { investmentSimulationService } from '../../services/investmentSimulationService';
import { aiExplainerService } from '../../services/aiExplainerService';
import { SimulationType } from '../../services/educationTypes';

const router = Router();

router.get('/courses', (req: Request, res: Response) => {
  const courses = educationService.getCourses();
  res.json({ success: true, courses });
});

router.get('/courses/:id', (req: Request, res: Response) => {
  const course = educationService.getCourseById(req.params.id);
  if (!course) {
    return res.status(404).json({ success: false, error: 'Course not found' });
  }
  res.json({ success: true, course });
});

router.get('/lessons', (req: Request, res: Response) => {
  const { difficulty } = req.query;
  if (difficulty) {
    const lessons = educationService.getLessonsByDifficulty(difficulty as any);
    return res.json({ success: true, lessons });
  }
  res.json({ success: true, lessons: educationService.getRecommendedLessons('beginner') });
});

router.get('/lessons/:id', (req: Request, res: Response) => {
  const lesson = educationService.getLessonById(req.params.id);
  if (!lesson) {
    return res.status(404).json({ success: false, error: 'Lesson not found' });
  }
  res.json({ success: true, lesson });
});

router.get('/quizzes/:lessonId', (req: Request, res: Response) => {
  const quiz = educationService.getQuizForLesson(req.params.lessonId);
  if (!quiz) {
    return res.status(404).json({ success: false, error: 'Quiz not found' });
  }
  res.json({ success: true, quiz: { ...quiz, questions: quiz.questions.map(q => ({ ...q, correctAnswer: '***' })) } });
});

router.post('/quizzes/:lessonId/submit', (req: Request, res: Response) => {
  const quiz = educationService.getQuizForLesson(req.params.lessonId);
  if (!quiz) {
    return res.status(404).json({ success: false, error: 'Quiz not found' });
  }

  const { answers } = req.body;
  let score = 0;
  let totalPoints = 0;

  const results = quiz.questions.map(q => {
    totalPoints += q.points;
    const userAnswer = answers[q.id];
    const isCorrect = userAnswer?.toLowerCase() === q.correctAnswer.toLowerCase();
    if (isCorrect) score += q.points;
    
    return {
      questionId: q.id,
      correct: isCorrect,
      explanation: q.explanation,
    };
  });

  const percentage = (score / totalPoints) * 100;
  const passed = percentage >= quiz.passingScore;

  res.json({
    success: true,
    result: {
      score,
      totalPoints,
      percentage: Math.round(percentage),
      passed,
      results,
    },
  });
});

router.get('/concepts', (req: Request, res: Response) => {
  const { category } = req.query;
  if (category) {
    const concepts = educationService.getConceptsByCategory(category as any);
    return res.json({ success: true, concepts });
  }
  res.json({ success: true, concepts: [] });
});

router.get('/concepts/:id', (req: Request, res: Response) => {
  const concept = educationService.getConceptById(req.params.id);
  if (!concept) {
    return res.status(404).json({ success: false, error: 'Concept not found' });
  }
  res.json({ success: true, concept });
});

router.get('/glossary', (req: Request, res: Response) => {
  const { search } = req.query;
  if (search) {
    const terms = educationService.searchGlossary(search as string);
    return res.json({ success: true, terms });
  }
  res.json({ success: true, terms: [] });
});

router.get('/simulations', (req: Request, res: Response) => {
  const simulations = investmentSimulationService.getAllSimulations();
  res.json({ success: true, simulations });
});

router.get('/simulations/:type', (req: Request, res: Response) => {
  const simulation = investmentSimulationService.getSimulation(req.params.type as SimulationType);
  if (!simulation) {
    return res.status(404).json({ success: false, error: 'Simulation not found' });
  }
  res.json({ success: true, simulation });
});

router.post('/simulations/:type/run', (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const params = req.body;

    const result = investmentSimulationService.runSimulation(type as SimulationType, params);

    res.json({ success: true, result });
  } catch (error) {
    res.status(400).json({ success: false, error: 'Simulation failed' });
  }
});

router.post('/explain', async (req: Request, res: Response) => {
  try {
    const { concept, question, context } = req.body;

    if (!concept && !question) {
      return res.status(400).json({ success: false, error: 'Provide concept or question' });
    }

    const explanation = await aiExplainerService.explain({ concept, question, context });

    res.json({ success: true, explanation });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Explanation failed' });
  }
});

router.get('/progress/:userId', (req: Request, res: Response) => {
  res.json({
    success: true,
    progress: {
      lessonsCompleted: 3,
      totalLessons: 10,
      coursesInProgress: 1,
      quizzesPassed: 2,
      points: 250,
    },
  });
});

export default router;
