"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

function getTimeLeft(deadline: string): TimeLeft {
  const total = new Date(deadline).getTime() - Date.now();
  if (total <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }
  return {
    total,
    days: Math.floor(total / 86400000),
    hours: Math.floor((total % 86400000) / 3600000),
    minutes: Math.floor((total % 3600000) / 60000),
    seconds: Math.floor((total % 60000) / 1000),
  };
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

interface CountdownTimerProps {
  deadline: string;
  variant?: "inline" | "segments";
  className?: string;
}

export function CountdownTimer({
  deadline,
  variant = "inline",
  className,
}: CountdownTimerProps) {
  const t = useTranslations("countdown");
  const [time, setTime] = useState<TimeLeft>(() => getTimeLeft(deadline));

  const isExpired = time.total <= 0;
  const isUrgent = !isExpired && time.total < 24 * 60 * 60 * 1000;

  useEffect(() => {
    const update = () => setTime(getTimeLeft(deadline));
    update();
    const initial = new Date(deadline).getTime() - Date.now();
    const interval = setInterval(update, initial <= 3600000 ? 1000 : 60000);
    return () => clearInterval(interval);
  }, [deadline]);

  if (variant === "segments") {
    if (isExpired) {
      return (
        <div
          className={cn("flex items-center gap-1.5", className)}
          role="timer"
          aria-label={t("endedAriaLabel")}
        >
          <span className="text-sm font-medium text-[var(--color-text-muted)]">
            {t("ended")}
          </span>
        </div>
      );
    }

    const segments = [
      { value: time.days, label: t("days") },
      { value: time.hours, label: t("hours") },
      { value: time.minutes, label: t("minutes") },
      { value: time.seconds, label: t("seconds") },
    ];

    return (
      <div
        className={cn("flex items-center gap-1", className)}
        role="timer"
        aria-live="polite"
        aria-atomic="true"
        aria-label={t("remainingAriaLabel", {
          days: time.days,
          hours: time.hours,
          minutes: time.minutes,
          seconds: time.seconds,
        })}
      >
        {segments.map(({ value, label }, i) => (
          <React.Fragment key={label}>
            <div className="flex items-baseline gap-0.5">
              <span
                className={cn(
                  "text-sm font-semibold tabular-nums",
                  isUrgent
                    ? "text-[var(--color-danger-subtle)]"
                    : "text-[var(--color-text-primary)]",
                )}
              >
                {pad(value)}
              </span>
              <span className="text-xs text-[var(--color-text-muted)]">
                {label}
              </span>
            </div>
            {i < segments.length - 1 && (
              <span className="text-xs text-[var(--color-text-muted)]">:</span>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  }

  // inline variant (default, backward compatible)
  if (isExpired) {
    return (
      <p
        aria-live="polite"
        aria-atomic="true"
        className={cn("text-xs text-[var(--color-text-muted)]", className)}
      >
        {t("ended")}
      </p>
    );
  }

  const { days, hours, minutes, seconds } = time;
  const timeStr =
    time.total > 3600000
      ? `${days}${t("days")} ${hours}${t("hours")} ${minutes}${t("minutes")}`
      : `${hours}${t("hours")} ${minutes}${t("minutes")} ${seconds}${t("seconds")}`;

  return (
    <p
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        "text-xs",
        isUrgent
          ? "text-[var(--color-danger-subtle)]"
          : "text-[var(--color-text-muted)]",
        className,
      )}
    >
      {t("left", { time: timeStr })}
    </p>
  );
}
