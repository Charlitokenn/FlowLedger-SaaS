import VerticalTabs, { VerticalTabItem } from "@/components/reusable components/reusable-vertical-tabs"
import PageHero from "@/components/ui/pageHero"
import { HandCoins, HouseIcon, Landmark, LandPlot } from "lucide-react"

const tabsData: VerticalTabItem[] = [
  {
    value: "tab-1",
    label: "Overview",
    icon: HouseIcon,
    content: (
      <div className="rounded border-l-2 border-dashed min-h-[490px] mr-3 pl-6 py-1 mx-3">
        <PageHero title="Project Overview" subtitle="Project overview" type="hero"/>
      </div>
    ),
  },
  {
    value: "tab-2",
    label: "Plots",
    icon: LandPlot,
    content: (
      <div className="rounded border-l-2 border-dashed min-h-[490px] mr-3 pl-6 py-1 mx-3">
        <PageHero title="Plots" subtitle="Here you can manage all the available and sold plots" type="hero"/>
      </div>
    ),
  },
  {
    value: "tab-3",
    label: "Debt Repayments",
    icon: Landmark,
    content: (
      <div className="rounded border-l-2 border-dashed min-h-[490px] mr-3 pl-6 py-1 mx-3">
        <PageHero title="Debt Repayments" subtitle="Manage all debt repayments for the project" type="hero"/>
      </div>
    ),
  },
  {
    value: "tab-4",
    label: "Income Collected",
    icon: HandCoins,
    content: (
      <div className="rounded border-l-2 border-dashed min-h-[490px] mr-3 pl-6 py-1 mx-3">
        <PageHero title="Income Collected" subtitle="Overview of all income collected" type="hero"/>
      </div>
    ),
  },
]

const ViewProjectForm = () => {
  return (
    <div className="mt-8 ml-2">
      <VerticalTabs tabs={tabsData} defaultValue="tab-1" />
    </div>

  )
}

export default ViewProjectForm