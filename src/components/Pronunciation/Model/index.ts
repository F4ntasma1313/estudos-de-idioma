export interface PronunciationProps {
  word: string;
  phonetic: string | null;
}

export interface PronunciationViewProps extends PronunciationProps {
  canSpeak: boolean;
  speak(): void;
}
