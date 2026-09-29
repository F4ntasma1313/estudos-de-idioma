export interface ReminderSettings { user_id: string; timezone: string; reminder_time: string; daily_reminder_enabled: boolean; push_enabled: boolean }
export interface LocalClock { date: string; minutes: number }
export interface DispatchReport { checked: number; due: number; delivered: number; failed: number }
