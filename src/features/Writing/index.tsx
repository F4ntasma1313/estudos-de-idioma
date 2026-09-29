import { WritingDetailView, WritingListView } from "./View";
import type { WritingDetailProps, WritingListProps } from "./Model";
export function WritingList(props: WritingListProps) { return <WritingListView {...props} />; }
export function WritingDetail(props: WritingDetailProps) { return <WritingDetailView {...props} />; }
