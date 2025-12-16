"use client"

import * as React from "react"
import VerticalTabs, { VerticalTabItem } from "@/components/reusable components/reusable-vertical-tabs"
import PageHero from "@/components/ui/pageHero"
import type { Plot, Project } from "@/database/tenant-schema"
import { HandCoins, HouseIcon, Landmark, LandPlot, LandPlotIcon, Text } from "lucide-react"
import { useDataTable } from "@/hooks/use-data-table"
import { DataTable } from "@/components/data-table/data-table"
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar"
import { type Column, type ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { Skeleton } from "@/components/ui/skeleton"
import { cn, toProperCase } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

function PlotsTable({ plots }: { plots: Plot[] }) {
  const columns = React.useMemo<ColumnDef<Plot>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        size: 32,
        enableSorting: false,
        enableHiding: false,
      },
      {
        id: "availability",
        accessorKey: "availability",
        header: ({ column }: { column: Column<Plot, unknown> }) => (
          <DataTableColumnHeader column={column} label="Status" />
        ),
        cell: ({ cell, row }) => {
          const value = cell.getValue<Plot["availability"]>()
          // const project = row.original as Plot;
          // if (deletingRowIds.has(project.id)) {
          //   return <Skeleton className="h-6 w-28" />;
          // }
          return <Badge className={
            cn("badge", value === "SOLD"
              ? "bg-destructive" : value === "AVAILABLE"
                ? "bg-green-700" : "")}>
            {toProperCase(value)}
          </Badge>;
        },
        meta: {
          label: "Status",
          placeholder: "Filter Availability...",
          variant: "text",
          icon: Text,
          searchable: true,
        },
        enableColumnFilter: false,
        enableHiding: false,
      },
      {
        id: "plotNumber",
        accessorKey: "plotNumber",
        header: ({ column }: { column: Column<Plot, unknown> }) => (
          <DataTableColumnHeader column={column} label="Plot Number" />
        ),
        cell: ({ cell, row }) => {
          // const project = row.original as Plot;
          // if (deletingRowIds.has(project.id)) {
          //   return <Skeleton className="h-6 w-28" />;
          // }
          return <div>Plot No. {cell.getValue<Plot["plotNumber"]>()}</div>;
        },
        meta: {
          label: "Plot Number",
          placeholder: "Search Plot...",
          variant: "text",
          icon: Text,
          searchable: true,
        },
        enableColumnFilter: true,
        enableHiding: false,
      },
      {
        id: "surveyedPlotNumber",
        accessorKey: "surveyedPlotNumber",
        header: ({ column }: { column: Column<Plot, unknown> }) => (
          <DataTableColumnHeader column={column} label="Surveyed Plot Number" />
        ),
        cell: ({ cell, row }) => {
          const value = cell.getValue<Plot["surveyedPlotNumber"]>()
          // const project = row.original as Plot;
          // if (deletingRowIds.has(project.id)) {
          //   return <Skeleton className="h-6 w-28" />;
          // }
          return <div>{toProperCase(value)}</div>;
        },
        meta: {
          label: "Status",
          placeholder: "Filter Availability...",
          variant: "text",
          icon: Text,
          searchable: true,
        },
        enableColumnFilter: false,
        enableHiding: false,
      },
      {
        id: "unsurveyedSize",
        accessorKey: "unsurveyedSize",
        header: ({ column }: { column: Column<Plot, unknown> }) => (
          <DataTableColumnHeader column={column} label="Unsurveyed Size" />
        ),
        cell: ({ cell, row }) => {
          const value = cell.getValue<Plot["unsurveyedSize"]>()
          // const project = row.original as Plot;
          // if (deletingRowIds.has(project.id)) {
          //   return <Skeleton className="h-6 w-28" />;
          // }
          return <div>Sqm {toProperCase(value)}</div>;
        },
        meta: {
          label: "Plot Size",
          placeholder: "Filter Size...",
          variant: "number",
          icon: Text,
          searchable: true,
        },
        enableColumnFilter: false,
        enableHiding: false,
      },
      {
        id: "surveyedSize",
        accessorKey: "surveyedSize",
        header: ({ column }: { column: Column<Plot, unknown> }) => (
          <DataTableColumnHeader column={column} label="Surveyed Size" />
        ),
        cell: ({ cell, row }) => {
          const value = cell.getValue<Plot["surveyedSize"]>()
          // const project = row.original as Plot;
          // if (deletingRowIds.has(project.id)) {
          //   return <Skeleton className="h-6 w-28" />;
          // }
          return <div>Sqm {toProperCase(value)}</div>;
        },
        meta: {
          label: "Surveyed Plot Size",
          placeholder: "Filter Size...",
          variant: "number",
          icon: Text,
          searchable: true,
        },
        enableColumnFilter: false,
        enableHiding: false,
      },
      {
        id: "contactId",
        accessorKey: "contactId",
        header: ({ column }: { column: Column<Plot, unknown> }) => (
          <DataTableColumnHeader column={column} label="Client Name" />
        ),
        cell: ({ cell, row }) => {
          const value = cell.getValue<Plot["contactId"]>()
          // const project = row.original as Plot;
          // if (deletingRowIds.has(project.id)) {
          //   return <Skeleton className="h-6 w-28" />;
          // }
          return <div>{toProperCase(value)}</div>;
        },
        meta: {
          label: "Client Name",
          placeholder: "Filter name...",
          variant: "text",
          icon: Text,
          searchable: true,
        },
        enableColumnFilter: false,
        enableHiding: false,
      },
    ], [])

  const { table } = useDataTable({
    data: plots,
    columns,
    initialState: {
      sorting: [{ id: "plotNumber", desc: false }],
      columnPinning: { right: ["actions"] },
      pagination: {
        pageSize: 6,
        pageIndex: 0,
      },
    },
    getRowId: (row) => row.id,
  });

  return (
    <DataTable
      table={table}
      emptyTitle="Add Plots"
      emptyDescription="No plots have been added so far!"
      emptyContent={<p>Hello</p>}
      emptyMedia={<LandPlotIcon />}
    >
      <DataTableToolbar table={table} />
    </DataTable>
  )
}

const ViewProjectForm = ({ project }: { project: Project }) => {

  const tabsData: VerticalTabItem[] = React.useMemo(() => {
    const plotsCount = project?.plots?.length ?? 0

    return [
      {
        value: "tab-1",
        label: "Overview",
        icon: HouseIcon,
        content: (
          <div className="rounded border-l-2 border-dashed min-h-[490px] mr-3 pl-6 py-1 mx-3">
            <PageHero
              title={project.projectName}
              subtitle={`Manage all the ${plotsCount} plot${plotsCount === 1 ? "" : "s"}`}
              type="hero"
            />
          </div>
        ),
      },
      {
        value: "tab-2",
        label: "Plots",
        icon: LandPlot,
        content: (
          <div className="rounded border-l-2 border-dashed min-h-[490px] mr-3 pl-6 py-1 mx-3">
            <PageHero
              title="Plots"
              subtitle="Manage all the available, reserved and sold plots"
              type="hero"
            />
            <div className="mt-4">{<PlotsTable plots={project?.plots ?? []} />}</div>
          </div>
        ),
      },
      {
        value: "tab-3",
        label: "Debt Repayments",
        icon: Landmark,
        content: (
          <div className="rounded border-l-2 border-dashed min-h-[490px] mr-3 pl-6 py-1 mx-3">
            <PageHero title="Debt Repayments" subtitle="Manage all debt repayments for the project" type="hero" />
          </div>
        ),
      },
      {
        value: "tab-4",
        label: "Income Collected",
        icon: HandCoins,
        content: (
          <div className="rounded border-l-2 border-dashed min-h-[490px] mr-3 pl-6 py-1 mx-3">
            <PageHero title="Income Collected" subtitle="Overview of all income collected" type="hero" />
          </div>
        ),
      },
    ]
  }, [project.projectName])

  return (
    <div className="mt-8 ml-2">
      <VerticalTabs tabs={tabsData} defaultValue="tab-1" />
    </div>
  )
}

export default ViewProjectForm