"use client"

import type * as React from "react"
import Link from "next/link"
import { X, Check, Trash2, FileText, Calendar } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type NotificationType = "user" | "document" | "calendar"

export interface Notification {
    id: string
    type: NotificationType
    title: string
    description: string
    timestamp: string
    isNew?: boolean
    avatarUrl?: string
    avatarFallback?: string
    icon?: React.ReactNode
    href?: string
}

interface NotificationsPanelProps {
    notifications: Notification[]
    onClose?: () => void
    onMarkAllRead?: () => void
    onClearNotifications?: () => void
    onNotificationClick?: (notification: Notification) => void
    className?: string
}

const NotificationIcon = ({ type, icon }: { type: NotificationType; icon?: React.ReactNode }) => {
    if (icon) return <>{icon}</>

    switch (type) {
        case "document":
            return (
                <div className="flex size-10 items-center justify-center rounded-lg bg-muted shrink-0">
                    <FileText className="size-5 text-muted-foreground" />
                </div>
            )
        case "calendar":
            return (
                <div className="flex size-10 items-center justify-center rounded-lg bg-muted shrink-0">
                    <Calendar className="size-5 text-muted-foreground" />
                </div>
            )
        default:
            return null
    }
}

export function NotificationsPanel({
                                       notifications,
                                       onClose,
                                       onMarkAllRead,
                                       onClearNotifications,
                                       onNotificationClick,
                                       className,
                                   }: NotificationsPanelProps) {
    return (
        <div className={cn("flex -mt-6 w-[300px] flex-col", className)}>
            {/* Header */}
            <div className="flex items-center justify-between border-b px-0 pb-2">
                <h2 className="text-base font-semibold text-foreground">Notifications</h2>
            </div>

            {/* Notifications List */}
            <div className="flex flex-col divide-y max-h-[265px] overflow-y-auto scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {notifications.map((notification) => {
                    const content = (
                        <div
                            key={notification.id} // Added key property here
                            className="flex items-center gap-3 px-4 py-1.5 hover:bg-muted/50 transition-colors cursor-pointer"
                            onClick={() => onNotificationClick?.(notification)}
                        >
                            {/* Icon/Avatar */}
                            {notification.type === "user" ? (
                                <Avatar className="size-10 shrink-0">
                                    <AvatarImage src={notification.avatarUrl || "/placeholder.svg"} alt={notification.title} />
                                    <AvatarFallback className="text-sm bg-primary/10 text-primary font-medium">
                                        {notification.avatarFallback || notification.title.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                            ) : (
                                <NotificationIcon type={notification.type} icon={notification.icon} />
                            )}

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start gap-2">
                                    <p className="text-[13px] font-medium text-foreground leading-tight">{notification.title}</p>
                                    {notification.isNew && (
                                        <span className="inline-flex items-center rounded bg-yellow-300 px-1.5 py-0.5 text-[8px] font-medium text-foreground uppercase shrink-0">
                                          new
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{notification.description}</p>
                                <p className="text-xs text-muted-foreground mt-1">{notification.timestamp}</p>
                            </div>
                        </div>
                    )

                    return notification.href ? (
                        <Link key={notification.id} href={notification.href} className="block">
                            {content}
                        </Link>
                    ) : (
                        <div key={notification.id}>{content}</div>
                    )
                })}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between gap-3 border-t pt-3">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onMarkAllRead}
                    className="cursor-pointer text-muted-foreground hover:text-foreground gap-1.5"
                >
                    <Check className="size-4" />
                    Mark all as read
                </Button>
                <Button size="sm" onClick={onClearNotifications} className="cursor-pointer bg-primary hover:bg-primary/80 text-white gap-1.5">
                    <Trash2 className="size-4" />
                    Clear Notification
                </Button>
            </div>
        </div>
    )
}
