import { benefits, type LandingViewProps } from "../Model";

export function getLandingContent(): LandingViewProps { return { benefits, primaryHref: "/auth?mode=signup", secondaryHref: "/auth" }; }
