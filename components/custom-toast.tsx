"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { CircleCheckIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

import {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastTitle,
} from "@/components/ui/toast"

interface UseProgressTimerProps {
  duration: number
  interval?: number
  onComplete?: () => void
}

function useProgressTimer({
  duration,
  interval = 100,
  onComplete,
}: UseProgressTimerProps) {
  const [progress, setProgress] = useState(duration)
  const timerRef = useRef<number>(0)
  const timerState = useRef({
    startTime: 0,
    remaining: duration,
    isPaused: false,
  })

  const cleanup = useCallback(() => {
    window.clearInterval(timerRef.current)
  }, [])

  const reset = useCallback(() => {
    cleanup()
    setProgress(duration)
    timerState.current = {
      startTime: 0,
      remaining: duration,
      isPaused: false,
    }
  }, [duration, cleanup])

  const start = useCallback(() => {
    const state = timerState.current
    state.startTime = Date.now()
    state.isPaused = false

    timerRef.current = window.setInterval(() => {
      const elapsedTime = Date.now() - state.startTime
      const remaining = Math.max(0, state.remaining - elapsedTime)

      setProgress(remaining)

      if (remaining <= 0) {
        cleanup()
        onComplete?.()
      }
    }, interval)
  }, [interval, cleanup, onComplete])

  const pause = useCallback(() => {
    const state = timerState.current
    if (!state.isPaused) {
      cleanup()
      state.remaining = Math.max(
        0,
        state.remaining - (Date.now() - state.startTime)
      )
      state.isPaused = true
    }
  }, [cleanup])

  const resume = useCallback(() => {
    const state = timerState.current
    if (state.isPaused && state.remaining > 0) {
      start()
    }
  }, [start])

  useEffect(() => {
    return cleanup
  }, [cleanup])

  return {
    progress,
    start,
    pause,
    resume,
    reset,
  }
}

interface CustomToastItemProps {
  title: string
  description?: string
  duration?: number
  variant?: "default" | "success" | "error" | "warning"
  showAction?: boolean
  actionLabel?: string
  onAction?: () => void
  onClose?: () => void
  autoOpen?: boolean
}

export default function CustomToastItem({
  title,
  description,
  duration = 5000,
  variant = "success",
  showAction = true,
  actionLabel = "Undo changes",
  onAction,
  onClose,
  autoOpen = false,
}: CustomToastItemProps) {
  const [open, setOpen] = useState(autoOpen)
  const { progress, start, pause, resume, reset } = useProgressTimer({
    duration,
    onComplete: () => {
      setOpen(false)
      onClose?.()
    },
  })

  const variantStyles = {
    default: {
      icon: CircleCheckIcon,
      iconColor: "text-blue-500",
      progressColor: "bg-blue-500",
    },
    success: {
      icon: CircleCheckIcon,
      iconColor: "text-emerald-500",
      progressColor: "bg-emerald-500",
    },
    error: {
      icon: XIcon,
      iconColor: "text-red-500",
      progressColor: "bg-red-500",
    },
    warning: {
      icon: CircleCheckIcon,
      iconColor: "text-amber-500",
      progressColor: "bg-amber-500",
    },
  }

  const style = variantStyles[variant]
  const Icon = style.icon

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      setOpen(isOpen)
      if (!isOpen) {
        onClose?.()
      }
    },
    [onClose]
  )

  const handleAction = useCallback(() => {
    onAction?.()
    setOpen(false)
  }, [onAction])

  useEffect(() => {
    if (autoOpen) {
      setOpen(true)
      reset()
      start()
    }
  }, [autoOpen, reset, start])

  return (
    <Toast
      open={open}
      onOpenChange={handleOpenChange}
      onPause={pause}
      onResume={resume}
    >
      <div className="flex w-full justify-between gap-3">
        <Icon
          className={`mt-0.5 shrink-0 ${style.iconColor}`}
          size={16}
          aria-hidden="true"
        />
        <div className="flex grow flex-col gap-3">
          <div className="space-y-1">
            <ToastTitle>{title}</ToastTitle>
            {description && (
              <ToastDescription>{description}</ToastDescription>
            )}
          </div>
          {showAction && (
            <div>
              <ToastAction altText={actionLabel} asChild>
                <Button size="sm" onClick={handleAction}>
                  {actionLabel}
                </Button>
              </ToastAction>
            </div>
          )}
        </div>
        <ToastClose asChild>
          <Button
            variant="ghost"
            className="group -my-1.5 -me-2 size-8 shrink-0 p-0 hover:bg-transparent"
            aria-label="Close notification"
          >
            <XIcon
              size={16}
              className="opacity-60 transition-opacity group-hover:opacity-100"
              aria-hidden="true"
            />
          </Button>
        </ToastClose>
      </div>
      <div className="contents" aria-hidden="true">
        <div
          className={`pointer-events-none absolute bottom-0 left-0 h-1 w-full ${style.progressColor}`}
          style={{
            width: `${(progress / duration) * 100}%`,
            transition: "width 100ms linear",
          }}
        />
      </div>
    </Toast>
  )
}