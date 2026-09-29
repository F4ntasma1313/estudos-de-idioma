export interface InstallPromptEvent extends Event { prompt(): Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> }
export interface PwaControlState { canInstall: boolean; updateAvailable: boolean; install(): Promise<void>; update(): void }
