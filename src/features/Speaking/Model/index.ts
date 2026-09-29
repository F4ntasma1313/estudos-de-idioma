import type { StudyCard } from "@/features/Vocabulary/Model";

export interface SpeakingProps { initialLevel: string }
export interface SpeakingResult { transcript: string; similarity: number }
export interface SpeechResultEvent { results: ArrayLike<ArrayLike<{ transcript: string }>> }
export interface SpeechErrorEvent { error: string }
export interface SpeechRecognitionAdapter {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: ((event: SpeechErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
export interface SpeechWindow extends Window {
  SpeechRecognition?: new () => SpeechRecognitionAdapter;
  webkitSpeechRecognition?: new () => SpeechRecognitionAdapter;
}
export interface SpeakingDeckResponse { success: boolean; data: { cards: StudyCard[] } | null; error: { message: string } | null }
