export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
  notes: string;
}

export interface Workout {
  id?: string;
  title: string;
  description: string;
  focusArea: string;
  difficulty: string;
  durationMinutes: number;
  exercises: Exercise[];
  is_favorite?: boolean;
  created_at?: string;
}

export interface CourtZone {
  id: string;
  name: string;
  x: number;
  y: number;
  points: number;
}

export interface PlaybookPlay {
  id: string;
  name: string;
  category: string;
  description: string;
  roles: string[];
  coachingPoints: string[];
}

export interface IQOption {
  text: string;
  correct: boolean;
  feedback: string;
}

export interface IQScenario {
  id: string;
  name: string;
  category: string;
  question: string;
  options: IQOption[];
}
