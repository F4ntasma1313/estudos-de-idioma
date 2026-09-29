export interface NotificationItem { id: string; type: string; title: string; message: string; path: string | null; readAt: string | null; createdAt: string }
export interface NotificationsViewProps { items: NotificationItem[]; error?: boolean; loadError?: boolean }
