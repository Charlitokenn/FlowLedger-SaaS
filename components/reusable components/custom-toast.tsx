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
  showAction = false,
  actionLabel = "Undo changes",
  onAction,
  onClose,
  autoOpen = false,
}: CustomToastItemProps) {
  const [open, setOpen] = useState(autoOpen)
  const progressBarRef = useRef<HTMLDivElement | null>(null)
  const progressAnimRef = useRef<Animation | null>(null)

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
    // Ensure the toast is opened when mounted from context.
    if (autoOpen) setOpen(true)
  }, [autoOpen])

  useEffect(() => {
    // Restart the progress bar animation whenever the toast opens.
    if (!open) {
      progressAnimRef.current?.cancel()
      progressAnimRef.current = null
      return
    }

    const el = progressBarRef.current
    if (!el) return

    progressAnimRef.current?.cancel()
    // Ensure we start from full width.
    el.style.transform = "scaleX(1)"

    // Use Web Animations API (avoids Tailwind/CSS layer issues and is very reliable).
    const anim = el.animate(
      [{ transform: "scaleX(1)" }, { transform: "scaleX(0)" }],
      {
        duration,
        easing: "linear",
        fill: "forwards",
      },
    )

    progressAnimRef.current = anim

    return () => {
      anim.cancel()
      if (progressAnimRef.current === anim) {
        progressAnimRef.current = null
      }
    }
  }, [open, duration])

  return (
    <Toast
      open={open}
      onOpenChange={handleOpenChange}
      duration={duration}
      onPause={() => {
        progressAnimRef.current?.pause()
      }}
      onResume={() => {
        // Some browsers may auto-finish; guard with try.
        try {
          progressAnimRef.current?.play()
        } catch {
          // no-op
        }
      }}
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
      <div
        ref={progressBarRef}
        aria-hidden="true"
        className={`pointer-events-none absolute bottom-0 left-0 z-10 h-1.5 w-full origin-left ${style.progressColor}`}
      />
    </Toast>
  )
}