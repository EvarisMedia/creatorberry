import { useEffect, useState, useCallback, useRef } from "react";
import { GeneratedPost } from "./useGeneratedPosts";
import { toast } from "sonner";

interface UseNotificationsOptions {
  posts: GeneratedPost[];
  brandName: string;
  enabled: boolean;
}

export function useNotifications({ posts, brandName, enabled }: UseNotificationsOptions) {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);
  const notifiedPostsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setIsSupported("Notification" in window);
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast.error("Notifications are not supported in this browser");
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === "granted") {
        toast.success("Notifications enabled!");
        return true;
      } else if (result === "denied") {
        toast.error("Notification permission denied");
        return false;
      }
      return false;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      toast.error("Failed to request notification permission");
      return false;
    }
  }, [isSupported]);

  const sendNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!isSupported || permission !== "granted") return null;

      try {
        const notification = new Notification(title, {
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          tag: options?.tag || "default",
          ...options,
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        return notification;
      } catch (error) {
        console.error("Error sending notification:", error);
        return null;
      }
    },
    [isSupported, permission]
  );

  // Check for overdue posts and send notifications
  useEffect(() => {
    if (!enabled || permission !== "granted" || !posts.length) return;

    const checkOverduePosts = () => {
      const now = new Date();
      const overduePosts = posts.filter(
        (post) =>
          post.status === "scheduled" &&
          post.scheduled_at &&
          new Date(post.scheduled_at) < now &&
          !notifiedPostsRef.current.has(post.id)
      );

      overduePosts.forEach((post) => {
        sendNotification(`Post ready to publish - ${brandName}`, {
          body: post.hook.substring(0, 100) + (post.hook.length > 100 ? "..." : ""),
          tag: `post-${post.id}`,
          requireInteraction: true,
        });
        notifiedPostsRef.current.add(post.id);
      });
    };

    // Check immediately
    checkOverduePosts();

    // Check every minute
    const interval = setInterval(checkOverduePosts, 60000);

    return () => clearInterval(interval);
  }, [posts, enabled, permission, brandName, sendNotification]);

  return {
    isSupported,
    permission,
    requestPermission,
    sendNotification,
  };
}
