export interface LessonItem { id: string; title: string; description: string; position: number; completed: boolean }
export interface ModuleItem { id: string; title: string; position: number; lessons: LessonItem[] }
export interface TrackItem { id: string; title: string; description: string; cefrLevel: string | null; modules: ModuleItem[] }
export interface LessonsViewProps { tracks: TrackItem[]; selectedLevel: string; activityCount: number }
