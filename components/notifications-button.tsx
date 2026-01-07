"use client"

import { NotificationsPanel, type Notification } from "@/components/reusable components/reusable-notification-panel"
import React, { useState } from "react"
import ReusablePopover from "@/components/reusable components/reusable-popover";
import {Bell} from "lucide-react";
import {Button} from "@/components/ui/button";
import CountUp from "@/components/motion/count-up";

export default function TenantNotificationsButton() {
    const [notifications, setNotifications] = useState<Notification[]>([
        {
            id: "1",
            type: "user",
            title: "Jenny Steltman",
            description: "Requested Holiday",
            timestamp: "5 min ago",
            isNew: true,
            avatarUrl: "/diverse-woman-portrait.png",
            avatarFallback: "JS",
        },
        {
            id: "2",
            type: "document",
            title: "Installments Followup",
            description: "20 installments due today",
            timestamp: "2 hours ago",
            isNew: true,
        },
        {
            id: "3",
            type: "calendar",
            title: "ISO-210",
            description: "Due Tomorrow",
            timestamp: "Yesterday, 2:30 pm",
            isNew: true,
        },
        {
            id: "4",
            type: "user",
            title: "James Dean",
            description: "Joined your team",
            timestamp: "Yesterday, 8:00 am",
            avatarUrl: "/man.jpg",
            avatarFallback: "JD",
            isNew: true,
        },
        {
            id: "5",
            type: "document",
            title: "Project Phoenix",
            description: "Waiting for your signature",
            timestamp: "2 days ago, 1:35 pm",
        },
    ])

    const handleMarkAllRead = () => {
        setNotifications(notifications.map((n) => ({ ...n, isNew: false })))
    }

    const handleClearNotifications = () => {
        setNotifications([])
    }

    const handleNotificationClick = (notification: Notification) => {
        console.log("[v0] Navigating to:", notification.href)
    }

    const newCount = notifications.filter((n) => n.isNew).length

    return (
    <ReusablePopover
        trigger={
            <Button variant="ghost" size="icon" className=" cursor-pointer relative bg-transparent">
                <Bell className="size-4.5" />
                {newCount > 0 && (
                    <span className="absolute -top-0 -right-0 flex size-3.5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      <CountUp from={0} to={newCount}/>
                    </span>)
                }
            </Button>
        }
        content={
            <NotificationsPanel
                notifications={notifications}
                onMarkAllRead={handleMarkAllRead}
                onClearNotifications={handleClearNotifications}
                onNotificationClick={handleNotificationClick}
            />
        }
    />
        // </main>
    )
}
