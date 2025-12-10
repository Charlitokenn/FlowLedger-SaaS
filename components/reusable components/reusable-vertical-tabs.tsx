import { LucideIcon } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

interface VerticalTabItem {
  value: string;
  label: string;
  icon: LucideIcon;
  content: React.ReactNode;
}

interface VerticalTabsProps {
  tabs: VerticalTabItem[];
  defaultValue?: string;
  className?: string;
  contentClassName?: string;
}

export default function VerticalTabs({
  tabs,
  defaultValue,
  className = "",
  contentClassName = "",
}: VerticalTabsProps) {
  const defaultTab = defaultValue || tabs[0]?.value

  return (
    <Tabs
      defaultValue={defaultTab}
      orientation="vertical"
      className={`w-full flex-row ${className}`}
    >
      <TabsList className="flex-col gap-1 rounded-none bg-transparent px-1 py-0 text-foreground">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="relative w-full justify-start after:absolute after:inset-y-0 after:start-0 after:-ms-1 after:w-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
            >
              <Icon
                className="-ms-0.5 me-1.5 opacity-60"
                size={16}
                aria-hidden="true"
              />
              {tab.label}
            </TabsTrigger>
          )
        })}
      </TabsList>
      <div className={`grow rounded-md border-0 text-start ${contentClassName}`}>
        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            {tab.content}
          </TabsContent>
        ))}
      </div>
    </Tabs>
  )
}

// Example usage:
/*
import { BoxIcon, HouseIcon, PanelsTopLeftIcon } from "lucide-react"
import VerticalTabs, { VerticalTabItem } from "./VerticalTabs"

const tabsData: VerticalTabItem[] = [
  {
    value: "tab-1",
    label: "Overview",
    icon: HouseIcon,
    content: (
      <p className="px-4 py-3 text-xs text-muted-foreground">
        Content for Tab 1
      </p>
    ),
  },
  {
    value: "tab-2",
    label: "Projects",
    icon: PanelsTopLeftIcon,
    content: (
      <p className="px-4 py-3 text-xs text-muted-foreground">
        Content for Tab 2
      </p>
    ),
  },
  {
    value: "tab-3",
    label: "Packages",
    icon: BoxIcon,
    content: (
      <p className="px-4 py-3 text-xs text-muted-foreground">
        Content for Tab 3
      </p>
    ),
  },
]

function App() {
  return <VerticalTabs tabs={tabsData} defaultValue="tab-1" />
}
*/