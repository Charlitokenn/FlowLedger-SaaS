"use client"

import * as React from "react"
import VerticalTabs, { VerticalTabItem } from "@/components/reusable components/reusable-vertical-tabs"
import PageHero from "@/components/ui/pageHero"
import type { Plot, Project } from "@/database/tenant-schema"
import { HandCoins, HouseIcon, Landmark, LandPlot, LandPlotIcon, Text, XIcon } from "lucide-react"
import { useDataTable } from "@/hooks/use-data-table"
import { DataTable } from "@/components/data-table/data-table"
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar"
import { type Column, type ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { Skeleton } from "@/components/ui/skeleton"
import { cn, toProperCase } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs"
import PlotsBulkUpload from "./plots-bulk-upload"
import { formatDate } from "@/lib/format"
import { DataTableActionBar } from "@/components/data-table/data-table-action-bar"
import ReusableTooltip from "@/components/reusable components/reusable-tooltip"
import { Separator } from "@/components/ui/separator"
import { DownloadIcon } from "@/components/icons"

function PlotsTable({ plots }: { plots: Plot[] }) {
  const [status] = useQueryState("availability", parseAsArrayOf(parseAsString).withDefault([]),);
  const [clientName] = useQueryState("clientName", parseAsString.withDefault(""));

  const filteredData = React.useMemo<Plot[]>(() => {
    if (!plots?.length) return [];

    return plots.filter((plot) => {
      // Client name filter
      if (clientName && !plot.contactId?.toLowerCase().includes(clientName.toLowerCase())) {
        return false;
      }

      // Availability multi-select filter
      if (status.length > 0 && !status.includes(plot.availability)) {
        return false;
      }

      return true;
    });
  }, [clientName, status, plots]);


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
          return (
            <Badge
              className={cn(
                "badge w-full py-0",
                value === "SOLD" ? "bg-destructive" : "bg-green-600",
              )}
            >
              {toProperCase(value)}
            </Badge>
          );
        },
        meta: {
          label: "Status",
          placeholder: "Filter Availability...",
          variant: "multiSelect",
          options: [
            { label: "Available", value: "AVAILABLE" },
            { label: "Sold", value: "SOLD" },
          ],
        },
        enableColumnFilter: true,
        enableHiding: false,
      },
      {
        id: "contactId",
        accessorKey: "contactId",
        header: ({ column }: { column: Column<Plot, unknown> }) => (
          <DataTableColumnHeader column={column} label="Sold To" />
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
          placeholder: "Search Client...", //TODO - Fix search is not currently working
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
          searchable: false,
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
          return <div>{value ? `Sqm ${value}` : ""}</div>;
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
          return <div>{value ? `Sqm ${value}` : ""}</div>;
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
    ], [])

  const { table: plotsTable } = useDataTable({
    data: filteredData,
    columns,
    initialState: {
      sorting: [{ id: "plotNumber", desc: false }],
      columnPinning: { right: ["actions"] },
      pagination: {
        pageSize: 8,
        pageIndex: 0,
      },
    },
    getRowId: (row) => row.id,
  });

  const handleDownloadCSV = React.useCallback(() => {
    const selectedRows = plotsTable.getFilteredSelectedRowModel().rows;

    if (selectedRows.length === 0) return;

    const plots = selectedRows.map(row => row.original);

    // Get all keys from the first project and filter out 'isDeleted'
    const headers = Object.keys(plots[0]).filter(key => key !== 'isDeleted');

    // Convert rows to CSV format
    const csvRows = plots.map(plot => {
      return headers.map(header => {
        const value = plot[header as keyof Plot];

        // Handle different data types
        if (value === null || value === undefined) {
          return '';
        }

        // Format dates if the field contains 'date' or 'Date'
        if (header.toLowerCase().includes('date') && typeof value === 'string') {
          return `"${formatDate(value)}"`;
        }

        // Escape and quote string values
        if (typeof value === 'string') {
          return `"${value.replace(/"/g, '""')}"`;
        }

        // Return numbers and booleans as-is
        return value;
      }).join(",");
    });

    // Combine headers and rows
    const csvContent = [headers.join(","), ...csvRows].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `plots_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }, [plotsTable]);

  const selectedRowsCount = plotsTable.getFilteredSelectedRowModel().rows.length

  return (
    <DataTable
      table={plotsTable}
      emptyTitle="Add Plots"
      emptyDescription="No plots have been added so far!"
      emptyMedia={<LandPlotIcon />}
      actionBar={
        <DataTableActionBar table={plotsTable} className="flex">
          <Badge variant="outline" className="gap-0 rounded-md px-2 py-1">
            {selectedRowsCount} Selected
            <button
              className="-my-[5px] -ms-0.5 -me-2 inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-[inherit] p-0 text-foreground/60 transition-[color,box-shadow] outline-none hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              aria-label="Clear selection"
            >
              <ReusableTooltip
                trigger={<XIcon size={14} aria-hidden="true" onClick={() => plotsTable.resetRowSelection()} />}
                tooltip="Clear selection"
              />
            </button>                        </Badge>
          <Separator orientation="vertical" />
          <ReusableTooltip
            trigger={<DownloadIcon onClick={handleDownloadCSV} className="text-gray-700 size-5 rounded p-0.3 cursor-pointer" />}
            tooltip={`Export ${selectedRowsCount > 1 ? `${selectedRowsCount} Selected Plots` : "Selected Plot" }`}
          />
        </DataTableActionBar>
      }
    >
      <DataTableToolbar table={plotsTable} />
    </DataTable>
  )
}
//TODO - Add a message/tooltip to be displayed whenever there is no internet connectivity
type ProjectWithPlots = Project & { plots?: Plot[] }

const ViewProjectForm = ({ project }: { project: ProjectWithPlots }) => {

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
              subtitle="Manage all the available and sold plots"
              type="hero"
              showButton
              buttonText="Update Plots"
              sheetSizeClass="max-w-2xl"
              hideSheetHeader
              hideSheetFooter
              sheetContent={<PlotsBulkUpload projectId={project.id} />}
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
  }, [project])

  return (
    <div className="mt-8 ml-2">
      <VerticalTabs tabs={tabsData} defaultValue="tab-1" />
    </div>
  )
}

export default ViewProjectForm