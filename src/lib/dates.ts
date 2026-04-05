import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  isToday,
  isSameDay,
  parseISO,
} from 'date-fns'

export function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 0 }) // Sunday
  const end = endOfWeek(date, { weekStartsOn: 0 })
  return eachDayOfInterval({ start, end })
}

export function nextWeek(date: Date): Date {
  return addWeeks(date, 1)
}

export function prevWeek(date: Date): Date {
  return subWeeks(date, 1)
}

export function toDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function formatDayLabel(date: Date): string {
  return format(date, 'EEE')
}

export function formatDayNumber(date: Date): string {
  return format(date, 'd')
}

export function formatMonthYear(date: Date): string {
  return format(date, 'MMMM yyyy')
}

export { isToday, isSameDay, parseISO }
