export type LessonStatus = 'not_started' | 'in_progress' | 'completed';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
export type ContentType = 'lesson' | 'quiz' | 'simulation' | 'interactive';

export interface Lesson {
  id: string;
  title: string;
  description: string;
  difficulty: DifficultyLevel;
  category: LessonCategory;
  content: LessonContent[];
  duration: number;
  order: number;
  prerequisites: string[];
  learningObjectives: string[];
}

export type LessonCategory = 
  | 'basics'
  | 'stocks'
  | 'bonds'
  | 'mutual_funds'
  | 'etfs'
  | 'real_estate'
  | 'taxes'
  | 'retirement'
  | 'risk_management'
  | 'technical_analysis'
  | 'fundamental_analysis';

export interface LessonContent {
  id: string;
  type: ContentType;
  title: string;
  body: string;
  media?: MediaContent;
  interactive?: InteractiveElement;
}

export interface MediaContent {
  type: 'image' | 'video' | 'infographic';
  url: string;
  caption?: string;
}

export interface InteractiveElement {
  type: 'calculator' | 'chart' | 'slider' | 'comparison' | 'scenario';
  config: Record<string, any>;
}

export interface Quiz {
  id: string;
  lessonId: string;
  questions: QuizQuestion[];
  passingScore: number;
  timeLimit?: number;
}

export interface QuizQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'fill_blank' | 'matching';
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  points: number;
}

export interface UserProgress {
  userId: string;
  lessonId: string;
  status: LessonStatus;
  completedContent: string[];
  quizScores: Record<string, number>;
  timeSpent: number;
  lastAccessedAt: Date;
  completedAt?: Date;
}

export interface UserLesson {
  lesson: Lesson;
  progress: UserProgress;
  nextLesson?: Lesson;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  difficulty: DifficultyLevel;
  lessons: Lesson[];
  estimatedDuration: number;
  certificate: boolean;
}

export interface Simulation {
  id: string;
  name: string;
  type: SimulationType;
  parameters: SimulationParameter[];
  scenario: SimulationScenario;
  outcomes: SimulationOutcome[];
}

export type SimulationType = 
  | 'portfolio_builder'
  | 'market_timing'
  | 'risk_return'
  | 'compound_growth'
  | 'dollar_cost_averaging'
  | 'sector_allocation';

export interface SimulationParameter {
  name: string;
  type: 'number' | 'select' | 'range' | 'percentage';
  min?: number;
  max?: number;
  options?: string[];
  defaultValue: any;
  label: string;
}

export interface SimulationScenario {
  title: string;
  description: string;
  initialState: Record<string, any>;
}

export interface SimulationOutcome {
  metric: string;
  value: number;
  format: 'currency' | 'percentage' | 'number';
}

export interface SimulationResult {
  simulationId: string;
  userId: string;
  parameters: Record<string, any>;
  outcomes: SimulationOutcome[];
  createdAt: Date;
}

export interface Concept {
  id: string;
  name: string;
  definition: string;
  explanation: string;
  examples: ConceptExample[];
  relatedConcepts: string[];
  category: LessonCategory;
  difficulty: DifficultyLevel;
}

export interface ConceptExample {
  title: string;
  description: string;
  calculation?: string;
  visual?: string;
}

export interface GlossaryTerm {
  term: string;
  definition: string;
  relatedTerms: string[];
  category: string;
}

export interface LearningPath {
  id: string;
  userId: string;
  courseId: string;
  currentLessonId: string;
  completedLessons: string[];
  progress: number;
  startedAt: Date;
  estimatedCompletion: Date;
}

export interface UserAchievement {
  id: string;
  userId: string;
  type: 'lesson_complete' | 'quiz_pass' | 'course_complete' | 'simulation_master' | 'streak';
  title: string;
  description: string;
  earnedAt: Date;
  points: number;
}

export interface Leaderboard {
  courseId?: string;
  entries: LeaderboardEntry[];
  updatedAt: Date;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  points: number;
  lessonsCompleted: number;
  rank: number;
}
