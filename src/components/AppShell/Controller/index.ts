import { navigation } from "../Model";
export function getNavigation(active: string) { return navigation.map((item) => ({ ...item, current: item.href === active })); }
