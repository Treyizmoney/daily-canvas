import { useCallback } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  getWeekDays,
  nextWeek,
  prevWeek,
  toDateString,
  formatDayLabel,
  formatDayNumber,
  formatMonthYear,
  isToday,
  isSameDay,
  parseISO,
} from '@/lib/dates'
import { cn } from '@/lib/utils'

interface WeekViewProps {
  selectedDate: string
  canvasDates: Set<string> // dates that have canvases
  onSelectDate: (date: string) => void
  onOpenDay: (date: string) => void
}

export function WeekView({ selectedDate, canvasDates, onSelectDate, onOpenDay }: WeekViewProps) {
  const currentDate = parseISO(selectedDate)
  const weekDays = getWeekDays(currentDate)

  const goToPrevWeek = useCallback(() => {
    onSelectDate(toDateString(prevWeek(currentDate)))
  }, [currentDate, onSelectDate])

  const goToNextWeek = useCallback(() => {
    onSelectDate(toDateString(nextWeek(currentDate)))
  }, [currentDate, onSelectDate])

  const goToToday = useCallback(() => {
    onSelectDate(toDateString(new Date()))
  }, [onSelectDate])

  return (
    <div className="flex flex-col gap-3 px-4 py-3 border-b border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">
          {formatMonthYear(currentDate)}
        </h2>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={goToPrevWeek} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={goToToday} className="h-8 px-3 text-xs">
            <Calendar className="h-3 w-3 mr-1" />
            Today
          </Button>
          <Button variant="ghost" size="icon" onClick={goToNextWeek} className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Week days */}
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day) => {
          const dateStr = toDateString(day)
          const isSelected = isSameDay(day, currentDate)
          const isTodayDate = isToday(day)
          const hasCanvas = canvasDates.has(dateStr)

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              onDoubleClick={() => onOpenDay(dateStr)}
              className={cn(
                'flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg transition-colors cursor-pointer',
                'hover:bg-accent',
                isSelected && 'bg-primary text-primary-foreground hover:bg-primary/90',
                !isSelected && isTodayDate && 'ring-1 ring-primary/50',
              )}
            >
              <span className="text-[10px] uppercase tracking-wider opacity-70">
                {formatDayLabel(day)}
              </span>
              <span className="text-lg font-medium leading-none">
                {formatDayNumber(day)}
              </span>
              {hasCanvas && (
                <div className={cn(
                  'w-1 h-1 rounded-full mt-0.5',
                  isSelected ? 'bg-primary-foreground' : 'bg-primary',
                )} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
