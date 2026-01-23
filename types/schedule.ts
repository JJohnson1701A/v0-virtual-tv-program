export interface TimeSlot {
  dayOfWeek: number // 0 = Sunday, 1 = Monday, etc.
  time: string // "8:00 PM" format
  date?: Date // The actual date clicked
}

export interface ScheduleItem {
  id: string
  channelId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  mediaId: string
  mediaType: string
  title: string
  runtime: number
  occurrence: "weekly" | "weekdays" | "one-time"
  scheduledDate?: string // ISO date string of when the schedule started
  order: "chronological" | "airdate" | "shuffle" | "random"
  repeat: "restart" | "end" | "follow-up"
  followUpMediaId?: string
  fillerSource: "channel" | "media-channel" | "media" | "block-marathon" | "block-marathon-channel" | "any" | "none"
  fillStyle: "intermixed" | "at-end" | "at-beginning" | "none" | "static"
}
