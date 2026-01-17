import { useMemo, useState } from "react";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, getYear, getMonth, setMonth, setYear } from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { GeneratedPost } from "@/hooks/useGeneratedPosts";
import { Brand } from "@/hooks/useBrands";
import { SchedulePostDialog } from "./SchedulePostDialog";

interface ScheduleCalendarProps {
  posts: GeneratedPost[];
  brand: Brand;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const POST_TYPE_COLORS: Record<string, string> = {
  educational_breakdown: "bg-blue-500",
  opinion_contrarian: "bg-orange-500",
  founder_story: "bg-green-500",
  case_study: "bg-purple-500",
  framework_post: "bg-pink-500",
  trend_reaction: "bg-yellow-500",
  lesson_learned: "bg-cyan-500",
};

export function ScheduleCalendar({ posts, brand }: ScheduleCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const scheduledPosts = useMemo(
    () => posts.filter((post) => post.scheduled_at),
    [posts]
  );

  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });

    const startDayOfWeek = start.getDay();
    const paddingDays = Array(startDayOfWeek).fill(null);

    return [...paddingDays, ...days];
  }, [currentMonth]);

  const getPostsForDay = (date: Date) => {
    return scheduledPosts.filter(
      (post) => post.scheduled_at && isSameDay(new Date(post.scheduled_at), date)
    );
  };

  const handleMonthChange = (month: string) => {
    setCurrentMonth(setMonth(currentMonth, parseInt(month)));
  };

  const handleYearChange = (year: string) => {
    setCurrentMonth(setYear(currentMonth, parseInt(year)));
  };

  const currentYear = getYear(currentMonth);
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <Card className="border-2 border-foreground">
      <CardHeader className="border-b-2 border-foreground pb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Month/Year Selectors */}
          <div className="flex items-center gap-2">
            <Select value={getMonth(currentMonth).toString()} onValueChange={handleMonthChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month, index) => (
                  <SelectItem key={month} value={index.toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={currentYear.toString()} onValueChange={handleYearChange}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(new Date())}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 border-b-2 border-foreground">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-muted-foreground py-3 border-r last:border-r-0 border-border"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            if (!day) {
              return (
                <div 
                  key={`padding-${index}`} 
                  className="min-h-[120px] bg-muted/30 border-r border-b border-border last:border-r-0" 
                />
              );
            }

            const dayPosts = getPostsForDay(day);
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDate && isSameDay(day, selectedDate);

            return (
              <div
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`
                  min-h-[120px] p-2 border-r border-b border-border last:border-r-0 cursor-pointer
                  transition-colors group relative
                  ${isToday ? "bg-primary/5" : "hover:bg-secondary/50"}
                  ${isSelected ? "ring-2 ring-primary ring-inset" : ""}
                `}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between mb-2">
                  <span className={`
                    text-sm font-medium
                    ${isToday ? "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center" : ""}
                  `}>
                    {format(day, "d")}
                  </span>
                  <SchedulePostDialog
                    post={null}
                    brandId={brand.id}
                    defaultDate={day}
                    trigger={
                      <button 
                        className="text-xs text-primary hover:underline opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Plus className="h-3 w-3" />
                        Add
                      </button>
                    }
                  />
                </div>

                {/* Posts List */}
                <div className="space-y-1 overflow-hidden">
                  <TooltipProvider>
                    {dayPosts.slice(0, 3).map((post) => (
                      <Tooltip key={post.id}>
                        <TooltipTrigger asChild>
                          <div 
                            className="flex items-center gap-1.5 text-xs group/post"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <SchedulePostDialog
                              post={post}
                              brandId={brand.id}
                              trigger={
                                <button className="flex items-center gap-1.5 w-full text-left hover:bg-secondary/80 rounded px-1 py-0.5 transition-colors">
                                  <span className={`w-2 h-2 rounded-full shrink-0 ${POST_TYPE_COLORS[post.post_type] || "bg-primary"}`} />
                                  <span className="truncate flex-1">{post.hook.slice(0, 20)}{post.hook.length > 20 ? "..." : ""}</span>
                                  <span className="text-muted-foreground shrink-0 text-[10px]">
                                    {post.scheduled_at && format(new Date(post.scheduled_at), "h:mma")}
                                  </span>
                                </button>
                              }
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-[300px]">
                          <p className="font-medium">{post.hook}</p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{post.body}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </TooltipProvider>
                  {dayPosts.length > 3 && (
                    <span className="text-xs text-muted-foreground pl-1">
                      +{dayPosts.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
