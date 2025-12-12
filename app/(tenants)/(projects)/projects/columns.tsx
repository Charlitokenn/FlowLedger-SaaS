"use client";

import { type Column, type ColumnDef } from "@tanstack/react-table";
import {
    Archive,
    DownloadIcon,
    Edit,
    Eye,
    Loader2,
    MoreHorizontal,
    Plus,
    SquarePen,
    Text,
    Trash2Icon,
    XIcon,
} from "lucide-react";
import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs";
import * as React from "react";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useDataTable } from "@/hooks/use-data-table";
import { formatDate } from "@/lib/format";
import { currencyNumber, timestampToDateString } from "@/lib/utils";
import { DataTableActionBar } from "@/components/data-table/data-table-action-bar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/reusable components/toast-context";
import ReusableTooltip from "@/components/reusable components/reusable-tooltip";
import { SoftDeleteProjects } from "@/lib/actions/tenants/projects.actions";
import ReusableSheet from "@/components/reusable components/reusable-sheet";
import ReusablePopover from "@/components/reusable components/reusable-popover";
import { AddProjectsForm } from "@/components/forms/projects/add-projects-form";
import { Project } from "@/database/tenant-schema";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DeleteIcon, EditIcon, ViewIcon } from "@/components/icons";
import EditProjectForm from "@/components/forms/projects/edit-project-form";
import ViewProjectForm from "@/components/forms/projects/view-project-form";

export const ProjectsTable = ({ data }: { data: Project[] }) => {
    const { showToast } = useToast()
    const [projectName] = useQueryState("projectName", parseAsString.withDefault(""));
    const [acquisitionDate] = useQueryState("acquisitionDate", parseAsArrayOf(parseAsString).withDefault([]));
    const [acquisitionValue] = useQueryState("acquisitionValue", parseAsArrayOf(parseAsString).withDefault([]));
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [deletingRowIds, setDeletingRowIds] = React.useState<Set<string>>(new Set());
    const [hiddenProjectIds, setHiddenProjectIds] = React.useState<Set<string>>(new Set());

    const filteredData = React.useMemo<Project[]>(() => {
        if (!data) return [];

        // Pre-convert all acquisition date timestamps once
        const dateStrings = acquisitionDate.map(timestampToDateString);
        const hasDateFilter = dateStrings.length > 0;
        const isDateRange = dateStrings.length === 2;

        // Pre-process acquisition value filter (convert query strings to numbers)
        const hasValueFilter = acquisitionValue.length > 0;
        const isValueRange = acquisitionValue.length === 2;
        const valueNumbers = acquisitionValue.map(v => parseFloat(v));

        // Sort for range comparisons if needed
        if (isDateRange) dateStrings.sort();
        if (isValueRange) valueNumbers.sort((a, b) => a - b);

        return data.filter((project: Project) => {
            // Optimistically hide rows that have been deleted on the client
            if (hiddenProjectIds.has(project.id)) {
                return false;
            }
            // Project name filter
            if (projectName && !project?.projectName.toLowerCase().includes(projectName.toLowerCase())) {
                return false;
            }

            // Date filter
            if (hasDateFilter) {
                const projectDate = project?.acquisitionDate;
                if (!projectDate) return false;

                if (isDateRange) {
                    if (!(projectDate >= dateStrings[0] && projectDate <= dateStrings[1])) {
                        return false;
                    }
                } else if (!dateStrings.includes(projectDate)) {
                    return false;
                }
            }

            // Acquisition value filter
            if (hasValueFilter) {
                const rawProjectValue = project?.acquisitionValue;
                if (rawProjectValue == null) return false;

                // Drizzle numeric fields are typically strings; convert to number for comparison
                const projectValue = Number(rawProjectValue);

                if (Number.isNaN(projectValue)) {
                    return false;
                }

                if (isValueRange) {
                    if (!(projectValue >= valueNumbers[0] && projectValue <= valueNumbers[1])) {
                        return false;
                    }
                } else if (!valueNumbers.includes(projectValue)) {
                    return false;
                }
            }

            return true;
        });
    }, [projectName, acquisitionDate, acquisitionValue, data, hiddenProjectIds]);

    const handleSingleDelete = React.useCallback(
        async (id: string) => {
            // mark this row as pending delete so we can show a skeleton
            setDeletingRowIds(prev => {
                const next = new Set(prev);
                next.add(id);
                return next;
            });
            try {
                await SoftDeleteProjects([id]);
                // Optimistically hide this row from the table
                setHiddenProjectIds(prev => {
                    const next = new Set(prev);
                    next.add(id);
                    return next;
                });
                showToast({
                    title: "Delete Successful",
                    description: "1 project has been deleted",
                    variant: "success",
                    showAction: false,
                });
            } catch (error) {
                console.error("Error deleting project:", error);
                showToast({
                    title: "Error Deleting Project",
                    description:
                        error instanceof Error ? error.message : "An unexpected error occurred",
                    variant: "error",
                    showAction: false,
                });
            } finally {
                // clear pending delete state for this row (it may already be hidden)
                setDeletingRowIds(prev => {
                    const next = new Set(prev);
                    next.delete(id);
                    return next;
                });
            }
        },
        [showToast],
    );

    const columns = React.useMemo<ColumnDef<Project>[]>(
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
                id: "acquisitionDate",
                accessorKey: "acquisitionDate",
                header: ({ column }: { column: Column<Project, unknown> }) => (
                    <DataTableColumnHeader column={column} label="Acquisition Date" />
                ),
                cell: ({ cell, row }) => {
                    const project = row.original as Project;
                    if (deletingRowIds.has(project.id)) {
                        return <Skeleton className="h-6 w-28" />;
                    }

                    const rawDate = cell.getValue<Project["acquisitionDate"]>();
                    // rawDate can be string | null; formatDate accepts string | number | Date | undefined
                    return <div>{formatDate(rawDate ?? undefined)}</div>;
                },
                meta: {
                    label: "Date Filter",
                    placeholder: "Filter Date...",
                    variant: "dateRange",
                    icon: Text,
                    searchable: true,
                },
                enableColumnFilter: true,
                enableHiding: false,
            },
            {
                id: "projectName",
                accessorKey: "projectName",
                header: ({ column }: { column: Column<Project, unknown> }) => (
                    <DataTableColumnHeader column={column} label="Project Name" />
                ),
                cell: ({ cell, row }) => {
                    const project = row.original as Project;
                    if (deletingRowIds.has(project.id)) {
                        return <Skeleton className="h-6 w-28" />;
                    }
                    return <div>{cell.getValue<Project["projectName"]>()}</div>;
                },
                meta: {
                    label: "Project Name",
                    placeholder: "Search Project...",
                    variant: "text",
                    icon: Text,
                    searchable: true,
                },
                enableColumnFilter: true,
                enableHiding: false,
            },
            {
                id: "acquisitionValue",
                accessorKey: "acquisitionValue",
                header: ({ column }: { column: Column<Project, unknown> }) => (
                    <DataTableColumnHeader column={column} label="Acquisition Value" />
                ),
                cell: ({ cell, row }) => {
                    const project = row.original as Project;
                    if (deletingRowIds.has(project.id)) {
                        return <Skeleton className="h-6 w-24" />;
                    }

                    const rawValue = cell.getValue<Project["acquisitionValue"]>();

                    // Drizzle numeric fields are usually string | null; currencyNumber expects a number
                    if (rawValue == null) {
                        return <div className="flex items-center gap-1">-</div>;
                    }

                    const numericValue = Number(rawValue);

                    return (
                        <div className="flex items-center gap-1">
                            {currencyNumber(numericValue)}
                        </div>
                    );
                },
                meta: {
                    label: "Acquisition Value",
                    placeholder: "Acquisition Value...",
                    variant: "range",
                    icon: Text,
                    searchable: true,
                },
                enableColumnFilter: true,
                enableHiding: true,
            },
            {
                id: "actions",
                cell: function Cell({ row }) {
                    const project = row.original as Project;
                    const editTriggerId = `project-edit-${project.id}`;
                    const viewTriggerId = `project-view-${project.id}`;
                    const deleteTriggerId = `project-delete-${project.id}`;

                    return (
                        <div className="flex flex-row">
                            {/* Hidden sheet triggers live outside the dropdown so they aren't unmounted when the menu closes */}
                            <ReusableSheet
                                triggerId={editTriggerId}
                                trigger={<span className="hidden" />}
                                title="Editing Project"
                                titleIcon={<SquarePen className="w-5.5 h-5.5" />}
                                formContent={<EditProjectForm project={project} />}
                                hideFooter={true}
                                hideHeader={true}
                                popupClass="max-w-full"
                            />
                            <ReusableSheet
                                triggerId={viewTriggerId}
                                trigger={<span className="hidden" />}
                                title="Viewing Project"
                                titleIcon={<SquarePen className="w-5.5 h-5.5" />}
                                formContent={<ViewProjectForm />}
                                hideFooter={true}
                                hideHeader={true}
                                popupClass="max-w-full"
                            />
                            <ReusablePopover
                                triggerId={deleteTriggerId}
                                trigger={<span className="hidden" />}
                                title="Confirm Delete?"
                                content={
                                    <Button
                                        size='sm'
                                        className="p-1 cursor-pointer w-full"
                                        onClick={() => handleSingleDelete(project.id)}
                                        disabled={deletingRowIds.has(project.id)}
                                    >
                                        {deletingRowIds.has(project.id) ? (
                                            <div className="flex gap-2 items-center">
                                                Deleting <Loader2 className="animate-spin" />
                                            </div>
                                        ) : (
                                            "Yes, Delete"
                                        )}
                                    </Button>
                                }
                                popoverClass="text-destructive"
                            />

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">Open menu</span>
                                        <MoreHorizontal />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        className="cursor-pointer"
                                        onSelect={() => {
                                            const btn = document.querySelector<HTMLButtonElement>(
                                                `[data-sheet-trigger-id='${editTriggerId}']`,
                                            );
                                            btn?.click();
                                        }}
                                    >
                                        <EditIcon className="size-4.5" />
                                        Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        className="cursor-pointer"
                                        onSelect={() => {
                                            const btn = document.querySelector<HTMLButtonElement>(
                                                `[data-sheet-trigger-id='${viewTriggerId}']`,
                                            );
                                            btn?.click();
                                        }}
                                    >
                                        <ViewIcon className="size-4.5" />
                                        View
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        className="cursor-pointer text-destructive hover:text-destructive!"
                                        onSelect={() => {
                                            const btn = document.querySelector<HTMLDivElement>(
                                                `[data-popover-trigger-id='${deleteTriggerId}']`,
                                            );
                                            btn?.click();
                                        }}
                                    >
                                        <DeleteIcon className="size-4.5 text-destructive" />
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    );
                },
                size: 32,
            },
        ],
        [deletingRowIds, handleSingleDelete],
    );

    const { table } = useDataTable({
        data: filteredData,
        columns,
        initialState: {
            sorting: [{ id: "acquisitionDate", desc: false }],
            columnPinning: { right: ["actions"] },
            pagination: {
                pageSize: 6,
                pageIndex: 0,
            },
        },
        getRowId: (row) => row.id,
    });

    const handleDownloadCSV = React.useCallback(() => {
        const selectedRows = table.getFilteredSelectedRowModel().rows;

        if (selectedRows.length === 0) return;

        const projects = selectedRows.map(row => row.original);

        // Get all keys from the first project and filter out 'isDeleted'
        const headers = Object.keys(projects[0]).filter(key => key !== 'isDeleted');

        // Convert rows to CSV format
        const csvRows = projects.map(project => {
            return headers.map(header => {
                const value = project[header as keyof Project];

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
        link.setAttribute("download", `projects_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = "hidden";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    }, [table]);

    const handleDelete = React.useCallback(async (ids?: string[]) => {
        const selectedRows = table.getFilteredSelectedRowModel().rows;
        const selectedIds = ids && ids.length > 0 ? ids : selectedRows.map(row => row.original.id);

        if (selectedIds.length === 0) return;

        // mark all selected rows as pending delete so we can show skeletons
        setDeletingRowIds(prev => {
            const next = new Set(prev);
            selectedIds.forEach(id => next.add(id));
            return next;
        });

        setIsDeleting(true);

        try {
            await SoftDeleteProjects(selectedIds);
            // Optimistically hide all deleted rows from the table
            setHiddenProjectIds(prev => {
                const next = new Set(prev);
                selectedIds.forEach(id => next.add(id));
                return next;
            });
            showToast({
                title: "Delete Successful",
                description: `${selectedIds.length} project${selectedIds.length > 1 ? "s" : ""} have been deleted`,
                variant: "success",
                showAction: false,
            });
            // Clear selection after successful delete
            table.resetRowSelection();
        } catch (error) {
            console.error("Error deleting projects:", error);

            showToast({
                title: "Error Deleting Projects",
                description: error instanceof Error ? error.message : "An unexpected error occurred",
                variant: "error",
                showAction: false,
            });
        } finally {
            setIsDeleting(false);
            // clear pending delete state for these rows (they may already be hidden)
            setDeletingRowIds(prev => {
                const next = new Set(prev);
                selectedIds.forEach(id => next.delete(id));
                return next;
            });
        }
    }, [table, showToast]);

    const selectedRowsCount = table.getFilteredSelectedRowModel().rows.length

    return (
        <div className="data-table-container">
            <DataTable
                table={table}
                emptyTitle="Add Projects"
                emptyDescription="No projects have been added so far!"
                emptyContent={
                    <ReusableSheet
                        trigger={<Button className="btn-primary"><Plus />New Project</Button>}
                        title="New Project"
                        titleIcon={<Archive className="w-5.5 h-5.5" />}
                        hideHeader={true}
                        hideFooter={true}
                        popupClass="max-w-full"
                        formContent={<AddProjectsForm />}
                        saveButtonText="Save Project"
                    />
                }
                emptyMedia={<Archive />}
                actionBar={
                    <DataTableActionBar table={table} className="flex">
                        <Badge variant="outline" className="gap-0 rounded-md px-2 py-1">
                            {selectedRowsCount} Selected
                            <button
                                className="-my-[5px] -ms-0.5 -me-2 inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-[inherit] p-0 text-foreground/60 transition-[color,box-shadow] outline-none hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                aria-label="Clear selection"
                            >
                                <ReusableTooltip
                                    trigger={<XIcon size={14} aria-hidden="true" onClick={() => table.resetRowSelection()} />}
                                    tooltip="Clear selection"
                                />
                            </button>                        </Badge>
                        <Separator orientation="vertical" />
                        <ReusableTooltip
                            trigger={<DownloadIcon onClick={handleDownloadCSV} className="text-gray-700 size-5 rounded p-0.3 cursor-pointer" />}
                            tooltip={`Export ${selectedRowsCount} Selected Projects`}
                        />
                        <ReusableTooltip
                            trigger={
                                <ReusablePopover
                                    trigger={<Trash2Icon className="text-destructive size-5 rounded p-0.3 cursor-pointer" />}
                                    title="Confirm Delete?"
                                    description={`Permanently delete ${selectedRowsCount} projects. This action can't be undone`}
                                    content={
                                        <Button
                                            size='sm'
                                            className="px-2 cursor-pointer"
                                            onClick={() => handleDelete()}
                                            disabled={isDeleting}
                                        >
                                            {isDeleting ? (
                                                <div className="flex gap-2 items-center">
                                                    Deleting <Loader2 className="animate-spin" />
                                                </div>
                                            ) : (
                                                "I'm Sure, Delete!"
                                            )}
                                        </Button>
                                    }
                                    popoverClass="text-destructive"
                                />
                            }
                            tooltip={`Delete ${selectedRowsCount} Selected Projects`}
                        />
                    </DataTableActionBar>
                }
            >
                <DataTableToolbar table={table} />
            </DataTable>
        </div>
    );
}