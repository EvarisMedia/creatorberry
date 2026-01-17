import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { GeneratedPost, useGeneratedPosts } from "@/hooks/useGeneratedPosts";
import { useUserSettings } from "@/hooks/useUserSettings";

interface SchedulePostDialogProps {
  post: GeneratedPost | null;
  brandId: string;
  trigger?: React.ReactNode;
  defaultDate?: Date;
}

const hours = Array.from({ length: 24 }, (_, i) => i);
const minutes = [0, 15, 30, 45];

export function SchedulePostDialog({ post, brandId, trigger, defaultDate }: SchedulePostDialogProps) {
  const { settings } = useUserSettings();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(
    post?.scheduled_at ? new Date(post.scheduled_at) : defaultDate
  );
  
  // Parse preferred posting time from settings (format: "HH:MM")
  const preferredTime = settings.preferred_posting_times?.[0] || "09:00";
  const [preferredHour, preferredMinute] = preferredTime.split(":").map(Number);
  
  const [hour, setHour] = useState<string>(
    post?.scheduled_at ? format(new Date(post.scheduled_at), "H") : preferredHour.toString()
  );
  const [minute, setMinute] = useState<string>(
    post?.scheduled_at 
      ? format(new Date(post.scheduled_at), "m") 
      : (preferredMinute || 0).toString()
  );

  // Update time when settings load
  useEffect(() => {
    if (settings.id && !post?.scheduled_at) {
      const [h, m] = (settings.preferred_posting_times?.[0] || "09:00").split(":").map(Number);
      setHour(h.toString());
      setMinute((m || 0).toString());
    }
  }, [settings.id, settings.preferred_posting_times, post?.scheduled_at]);

  const { schedulePost, unschedulePost } = useGeneratedPosts(brandId);

  const handleSchedule = () => {
    if (!date || !post) return;

    const scheduledDate = new Date(date);
    scheduledDate.setHours(parseInt(hour), parseInt(minute), 0, 0);

    schedulePost.mutate(
      { id: post.id, scheduledAt: scheduledDate },
      {
        onSuccess: () => setOpen(false),
      }
    );
  };

  const handleUnschedule = () => {
    if (!post) return;
    unschedulePost.mutate(post.id, {
      onSuccess: () => setOpen(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Clock className="h-4 w-4 mr-2" />
            Schedule
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Post</DialogTitle>
          <DialogDescription>
            Choose when this post should be published to LinkedIn.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Post Preview */}
          {post ? (
            <div className="p-3 border bg-muted/50">
              <p className="text-sm font-medium line-clamp-2">{post.hook}</p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{post.body}</p>
            </div>
          ) : (
            <div className="p-3 border bg-muted/50 text-center">
              <p className="text-sm text-muted-foreground">Select a post to schedule from the Content page</p>
            </div>
          )}

          {/* Date Picker */}
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Picker */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Hour</Label>
              <Select value={hour} onValueChange={setHour}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {hours.map((h) => (
                    <SelectItem key={h} value={h.toString()}>
                      {h.toString().padStart(2, "0")}:00
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Minute</Label>
              <Select value={minute} onValueChange={setMinute}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {minutes.map((m) => (
                    <SelectItem key={m} value={m.toString()}>
                      :{m.toString().padStart(2, "0")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Selected Time Preview */}
          {date && (
            <div className="p-3 border bg-primary/5">
              <p className="text-sm">
                <span className="font-medium">Scheduled for:</span>{" "}
                {format(
                  new Date(
                    date.getFullYear(),
                    date.getMonth(),
                    date.getDate(),
                    parseInt(hour),
                    parseInt(minute)
                  ),
                  "EEEE, MMMM d, yyyy 'at' h:mm a"
                )}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {post?.scheduled_at && (
            <Button
              variant="outline"
              onClick={handleUnschedule}
              disabled={unschedulePost.isPending}
              className="flex-1"
            >
              Unschedule
            </Button>
          )}
          <Button
            onClick={handleSchedule}
            disabled={!date || !post || schedulePost.isPending}
            className="flex-1"
          >
            {schedulePost.isPending ? "Scheduling..." : "Schedule Post"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
