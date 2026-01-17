import { Bell, BellOff, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface NotificationToggleProps {
  isSupported: boolean;
  permission: NotificationPermission;
  enabled: boolean;
  onToggle: () => void;
  onRequestPermission: () => void;
}

export function NotificationToggle({
  isSupported,
  permission,
  enabled,
  onToggle,
  onRequestPermission,
}: NotificationToggleProps) {
  if (!isSupported) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" disabled className="gap-2">
              <BellOff className="h-4 w-4" />
              Not Supported
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Notifications are not supported in this browser</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (permission === "denied") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" disabled className="gap-2">
              <BellOff className="h-4 w-4" />
              Blocked
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Notifications are blocked. Enable them in browser settings.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (permission !== "granted") {
    return (
      <Button variant="outline" size="sm" onClick={onRequestPermission} className="gap-2">
        <Bell className="h-4 w-4" />
        Enable Notifications
      </Button>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={enabled ? "default" : "outline"}
            size="sm"
            onClick={onToggle}
            className="gap-2"
          >
            {enabled ? (
              <>
                <BellRing className="h-4 w-4" />
                Alerts On
              </>
            ) : (
              <>
                <BellOff className="h-4 w-4" />
                Alerts Off
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{enabled ? "Click to disable alerts" : "Click to enable alerts for due posts"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
