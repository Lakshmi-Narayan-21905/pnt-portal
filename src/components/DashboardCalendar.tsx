import React, { useState } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    isWithinInterval,
    startOfDay,
    endOfDay
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface CalendarEvent {
    id: string;
    title: string;
    date?: Date; // For single date events (Company)
    startDate?: Date; // For range events (Training)
    endDate?: Date; // For range events (Training)
    color?: string; // Optional override
}

interface DashboardCalendarProps {
    title: string;
    events: CalendarEvent[];
    type: 'point' | 'range'; // 'point' for single dates, 'range' for durations
    onEventClick?: (event: CalendarEvent) => void;
}

const DashboardCalendar: React.FC<DashboardCalendarProps> = ({ title, events, type, onEventClick }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const isDayHasEvent = (day: Date) => {
        if (type === 'point') {
            return events.filter(e => e.date && isSameDay(e.date, day));
        } else {
            // Check if day falls within any event's range
            // We strip time for accurate day comparison
            const checkDay = startOfDay(day);
            return events.filter(e => {
                if (!e.startDate || !e.endDate) return false;
                return isWithinInterval(checkDay, {
                    start: startOfDay(e.startDate),
                    end: endOfDay(e.endDate)
                });
            });
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-gray-800">{title}</h3>
                <div className="flex gap-2">
                    <button onClick={prevMonth} className="p-1 hover:bg-gray-200 rounded-full transition">
                        <ChevronLeft className="w-4 h-4 text-gray-600" />
                    </button>
                    <span className="text-sm font-medium text-gray-600 min-w-[100px] text-center">
                        {format(currentMonth, 'MMMM yyyy')}
                    </span>
                    <button onClick={nextMonth} className="p-1 hover:bg-gray-200 rounded-full transition">
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                    </button>
                </div>
            </div>

            <div className="p-4 flex-1 flex flex-col">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 mb-2">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                        <div key={day} className="text-center text-xs font-semibold text-gray-400 uppercase">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days Grid - Expanded height for labels */}
                {/* auto-rows-fr helps distribute height if container allows, but fixed min-h is safer for content */}
                <div className="grid grid-cols-7 gap-1 auto-rows-fr">
                    {calendarDays.map((day) => {
                        const dayEvents = isDayHasEvent(day);
                        const hasEvents = dayEvents.length > 0;
                        const isCurrentMonth = isSameMonth(day, monthStart);

                        let cellClass = "min-h-[60px] p-1 flex flex-col items-center justify-start rounded-lg text-sm relative transition group border border-transparent ";

                        if (!isCurrentMonth) {
                            cellClass += "text-gray-300 ";
                        } else {
                            cellClass += "text-gray-700 hover:bg-gray-50 ";
                            if (hasEvents) {
                                cellClass += "cursor-pointer hover:border-indigo-100 shadow-sm ";
                            }
                        }

                        if (type === 'range' && hasEvents && isCurrentMonth) {
                            cellClass += "bg-orange-50 text-orange-900 border-orange-100 ";
                        }

                        if (type === 'point' && hasEvents && isCurrentMonth) {
                            cellClass += "bg-indigo-50 text-indigo-900 border-indigo-100 ";
                        }

                        // Get the first event to display label
                        const displayEvent = dayEvents[0];

                        return (
                            <div
                                key={day.toString()}
                                className={cellClass}
                                onClick={() => hasEvents && onEventClick && onEventClick(displayEvent)}
                                title={hasEvents ? dayEvents.map(e => e.title).join(', ') : ''}
                            >
                                <span className={`font-medium ${hasEvents && isCurrentMonth ? 'text-base' : ''}`}>
                                    {format(day, 'd')}
                                </span>

                                {hasEvents && isCurrentMonth && (
                                    <div className="mt-1 w-full px-1">
                                        <div className={`text-[10px] leading-tight truncate rounded px-1 py-0.5 w-full text-center ${type === 'point' ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'
                                            }`}>
                                            {displayEvent.title}
                                            {dayEvents.length > 1 && <span className="ml-1 text-[9px] opacity-75">+{dayEvents.length - 1}</span>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="mt-4 text-xs text-gray-400 text-center">
                    {type === 'range' ? 'Orange days indicate scheduled training.' : 'Blue days indicate upcoming drives.'}
                </div>
            </div>
        </div>
    );
};

export default DashboardCalendar;
