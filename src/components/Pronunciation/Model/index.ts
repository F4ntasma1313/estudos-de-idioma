export interface PronunciationProps {
  word: string;
  phonetic: string | null;
}

export interface PronunciationViewProps {
  word: string;
  readable: string | null;
  canSpeak: boolean;
  speak(): void;
}
