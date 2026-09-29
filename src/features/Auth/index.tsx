import { AuthView, PasswordUpdateView } from "./View";
import type { AuthMode } from "./Model";

export function Auth({ mode }: { mode: AuthMode }) { return <AuthView initialMode={mode} />; }
export function PasswordUpdate() { return <PasswordUpdateView />; }
