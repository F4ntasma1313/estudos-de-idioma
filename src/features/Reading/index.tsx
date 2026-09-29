import { ReadingDetailView, ReadingListView } from "./View";
import type { ReadingDetailProps, ReadingListProps } from "./Model";
export function ReadingList(props: ReadingListProps) { return <ReadingListView {...props} />; }
export function ReadingDetail(props: ReadingDetailProps) { return <ReadingDetailView {...props} />; }
