import { getLandingContent } from "./Controller";
import { LandingView } from "./View";

export function Landing() { return <LandingView {...getLandingContent()} />; }
