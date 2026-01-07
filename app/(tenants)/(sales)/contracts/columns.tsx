"use client";

import * as React from "react";
import { type Column, type ColumnDef } from "@tanstack/react-table";
import {
    Archive,
    Loader2,
    MoreHorizontal,
    Plus,
    Search,
    SquarePen,
    Text,
    Trash2Icon,
    XIcon,
} from "lucide-react";
import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useDataTable } from "@/hooks/use-data-table";
import { formatDate } from "@/lib/format";
import { cn, currencyNumber, timestampToDateString, toProperCase } from "@/lib/utils";
import { DataTableActionBar } from "@/components/data-table/data-table-action-bar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/reusable components/toast-context";
import ReusableTooltip from "@/components/reusable components/reusable-tooltip";
import ReusableSheet from "@/components/reusable components/reusable-sheet";
import ReusablePopover from "@/components/reusable components/reusable-popover";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteIcon, DownloadIcon, EditIcon, ViewIcon } from "@/components/icons";

import {ContractListRow, GetContracts} from "@/lib/actions/tenants/contracts.actions";
import { CancelContract } from "@/lib/actions/tenants/contracts.actions";
import { AddContractForm } from "@/components/forms/contracts/add-contract-form";
import EditContractForm from "@/components/forms/contracts/edit-contract-form";
import ViewContractForm from "@/components/forms/contracts/view-contract-form";

export const ContractsTable = ({ data }: { data: ContractListRow[] }) => {
    const { showToast } = useToast();

    const [viewContract, setViewContract] = React.useState<ContractListRow | null>(null);
    const viewTriggerId = "contracts-view-sheet";

    // Filters from URL
    const [clientName] = useQueryState(
        "clientContactId",
        parseAsString.withDefault(""),
    );
    const [contractDate] = useQueryState(
        "startDate",
        parseAsArrayOf(parseAsString).withDefault([]),
    );
    const [status] = useQueryState(
        "status",
        parseAsArrayOf(parseAsString).withDefault([]),
    );
    const [contractValue] = useQueryState(
        "totalContractValue",
        parseAsArrayOf(parseAsString).withDefault([]),
    );

    const [isCancelling, setIsCancelling] = React.useState(false);
    const [cancellingIds, setCancellingIds] = React.useState<Set<string>>(new Set());

    const filteredData = React.useMemo<ContractListRow[]>(() => {
        if (!data) return [];

        // Date filter
        const dateStrings = contractDate.map(timestampToDateString);
        const hasDateFilter = dateStrings.length > 0;
        const isDateRange = dateStrings.length === 2;
        if (isDateRange) dateStrings.sort();

        // Value filter
        const hasValueFilter = contractValue.length > 0;
        const isValueRange = contractValue.length === 2;
        const valueNumbers = contractValue.map((v) => parseFloat(v));
        if (isValueRange) valueNumbers.sort((a, b) => a - b);

        const clientSearch = clientName?.toLowerCase() ?? "";

        return data.filter((contract) => {
            // Client name filter
            if (
                clientSearch &&
                !contract.client?.fullName?.toLowerCase().includes(clientSearch)
            ) {
                return false;
            }

            // Status multi-select filter
            if (status.length > 0 && !status.includes(contract.status)) {
                return false;
            }

            // Date filter (startDate is date-only string)
            if (hasDateFilter) {
                const start = contract.startDate;
                if (!start) return false;

                if (isDateRange) {
                    if (!(start >= dateStrings[0] && start <= dateStrings[1])) {
                        return false;
                    }
                } else if (!dateStrings.includes(start)) {
                    return false;
                }
            }

            // Contract value filter
            if (hasValueFilter) {
                const raw = contract.totalContractValue;
                if (raw == null) return false;

                const value = Number(raw);
                if (Number.isNaN(value)) return false;

                if (isValueRange) {
                    if (!(value >= valueNumbers[0] && value <= valueNumbers[1])) {
                        return false;
                    }
                } else if (!valueNumbers.includes(value)) {
                    return false;
                }
            }

            return true;
        });
    }, [clientName, status, contractDate, contractValue, data]);

    // Single cancel
    const handleSingleCancel = React.useCallback(
        async (id: string) => {
            setCancellingIds((prev) => new Set(prev).add(id));

            try {
                const res = await CancelContract({
                    contractId: id,
                    reason: "Cancelled from contracts table",
                });

                if (!res.success) {
                    throw new Error(res.error);
                }

                showToast({
                    title: "Contract cancelled",
                    description: "1 contract has been cancelled",
                    variant: "success",
                    showAction: false,
                });
            } catch (error) {
                console.error("Error cancelling contract:", error);
                showToast({
                    title: "Error Cancelling Contract",
                    description:
                        error instanceof Error ? error.message : "An unexpected error occurred",
                    variant: "error",
                    showAction: false,
                });
            } finally {
                setCancellingIds((prev) => {
                    const next = new Set(prev);
                    next.delete(id);
                    return next;
                });
            }
        },
        [showToast],
    );

    const columns = React.useMemo<ColumnDef<ContractListRow>[]>(
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
                id: "status",
                accessorKey: "status",
                header: ({ column }: { column: Column<ContractListRow, unknown> }) => (
                    <DataTableColumnHeader column={column} label="Status" />
                ),
                cell: ({ cell }) => {
                    const value = cell.getValue<ContractListRow["status"]>();

                    return (
                        <Badge
                            className={cn(
                                "badge w-20 py-0",
                                value === "CANCELLED"
                                    ? "bg-destructive"
                                    : value === "ACTIVE"
                                        ? "bg-green-600"
                                        : "",
                            )}
                        >
                            {toProperCase(value)}
                        </Badge>
                    );
                },
                meta: {
                    label: "Status",
                    placeholder: "Filter Status...",
                    variant: "multiSelect",
                    options: [
                        { label: "Active", value: "ACTIVE" },
                        { label: "Delinquent", value: "DELINQUENT" },
                        { label: "Completed", value: "COMPLETED" },
                        { label: "Cancelled", value: "CANCELLED" },
                    ],
                },
                enableColumnFilter: true,
                enableHiding: false,
            },
            {
                id: "startDate",
                accessorKey: "startDate",
                header: ({ column }: { column: Column<ContractListRow, unknown> }) => (
                    <DataTableColumnHeader column={column} label="Contract Date" />
                ),
                cell: ({ cell, row }) => {
                    const contract = row.original;
                    if (cancellingIds.has(contract.id)) {
                        return <Skeleton className="h-6 w-28" />;
                    }

                    const raw = cell.getValue<ContractListRow["startDate"]>();
                    return <div>{formatDate(raw ?? undefined)}</div>;
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
                id: "clientContactId",
                accessorFn: (row) => row.client?.fullName ?? "",
                header: ({ column }: { column: Column<ContractListRow, unknown> }) => (
                    <DataTableColumnHeader column={column} label="Client Name" />
                ),
                cell: ({ row }) => {
                    const contract = row.original;
                    if (cancellingIds.has(contract.id)) {
                        return <Skeleton className="h-6 w-28" />;
                    }
                    return <div>{contract.client?.fullName ?? ""}</div>;
                },
                meta: {
                    label: "Client Name",
                    placeholder: "Search Client...",
                    variant: "text",
                    icon: Text,
                    searchable: true,
                },
                enableColumnFilter: true,
                enableHiding: false,
            },
            {
                id: "plotId",
                accessorKey: "plotId",
                header: ({ column }: { column: Column<ContractListRow, unknown> }) => (
                    <DataTableColumnHeader column={column} label="Plot No" />
                ),
                cell: ({ row }) => {
                    const contract = row.original;
                    if (cancellingIds.has(contract.id)) {
                        return <Skeleton className="h-6 w-28" />;
                    }
                    return <div>Plot No. {contract.plot?.plotNumber ?? "-"}</div>;
                },
                meta: {
                    label: "Plot ID",
                    placeholder: "Search Plot...",
                    variant: "text",
                    icon: Text,
                    searchable: true,
                },
                enableColumnFilter: false,
                enableHiding: false,
            },
            {
                id: "totalContractValue",
                accessorKey: "totalContractValue",
                header: ({ column }: { column: Column<ContractListRow, unknown> }) => (
                    <DataTableColumnHeader column={column} label="Contract Value" />
                ),
                cell: ({ cell, row }) => {
                    const contract = row.original;
                    if (cancellingIds.has(contract.id)) {
                        return <Skeleton className="h-6 w-24" />;
                    }

                    const raw = cell.getValue<ContractListRow["totalContractValue"]>();
                    if (raw == null) {
                        return <div className="flex items-center gap-1">-</div>;
                    }

                    const numericValue = Number(raw);
                    return (
                        <div className="flex items-center gap-1">
                            {currencyNumber(numericValue)}
                        </div>
                    );
                },
                meta: {
                    label: "Contract Value",
                    placeholder: "Contract Value...",
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
                    const contract = row.original as ContractListRow;
                    const editTriggerId = `contract-edit-${contract.id}`;
                    const deleteTriggerId = `contract-delete-${contract.id}`;

                    return (
                        <div className="flex flex-row">
                            {/* Hidden sheet triggers live outside the dropdown so they aren't unmounted when the menu closes */}
                            <ReusableSheet
                                triggerId={editTriggerId}
                                trigger={<span className="hidden" />}
                                title="Editing Contract"
                                titleIcon={<SquarePen className="w-5.5 h-5.5" />}
                                formContent={<EditContractForm contract={contract} />}
                                hideFooter
                                hideHeader
                                popupClass="max-w-full"
                            />
                            <ReusablePopover
                                triggerId={deleteTriggerId}
                                trigger={<span className="hidden" />}
                                title="Confirm Cancel?"
                                content={
                                    <Button
                                        size="sm"
                                        className="p-1 btn-primary w-full"
                                        onClick={() => handleSingleCancel(contract.id)}
                                        disabled={cancellingIds.has(contract.id)}
                                    >
                                        {cancellingIds.has(contract.id) ? (
                                            <div className="flex gap-2 items-center">
                                                Cancelling <Loader2 className="animate-spin" />
                                            </div>
                                        ) : (
                                            "Yes, Cancel"
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
                                            // Set the selected contract, then open the shared view sheet.
                                            setViewContract(contract);
                                            setTimeout(() => {
                                                const btn =
                                                    document.querySelector<HTMLButtonElement>(
                                                        `[data-sheet-trigger-id='${viewTriggerId}']`,
                                                    );

                                                const isOpen =
                                                    btn?.getAttribute("aria-expanded") === "true";
                                                if (!isOpen) {
                                                    btn?.click();
                                                }
                                            }, 0);
                                        }}
                                    >
                                        <ViewIcon className="size-4.5" />
                                        View
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        className="cursor-pointer text-destructive hover:text-destructive!"
                                        onSelect={() => {
                                            const btn =
                                                document.querySelector<HTMLDivElement>(
                                                    `[data-popover-trigger-id='${deleteTriggerId}']`,
                                                );
                                            btn?.click();
                                        }}
                                    >
                                        <DeleteIcon className="size-4.5 text-destructive" />
                                        Cancel
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    );
                },
                size: 32,
            },
        ],
        [cancellingIds, handleSingleCancel],
    );

    const { table: contractsTable } = useDataTable({
        data: filteredData,
        columns,
        initialState: {
            sorting: [{ id: "startDate", desc: false }],
            columnPinning: { right: ["actions"] },
            pagination: {
                pageSize: 6,
                pageIndex: 0,
            },
        },
        getRowId: (row) => row.id,
    });

    const handleDownloadCSV = React.useCallback(() => {
        const selectedRows = contractsTable.getFilteredSelectedRowModel().rows;
        if (selectedRows.length === 0) return;

        const contracts = selectedRows.map((row) => row.original as ContractListRow);
        if (contracts.length === 0) return;

        const headers = [
            "id",
            "status",
            "startDate",
            "totalContractValue",
            "clientName",
            "plotNumber",
        ];

        const csvRows = contracts.map((contract) => {
            const row: (string | number)[] = [];
            const clientName = contract.client?.fullName ?? "";
            const plotNumber = contract.plot?.plotNumber ?? "";

            headers.forEach((h) => {
                let value: unknown;
                switch (h) {
                    case "id":
                        value = contract.id;
                        break;
                    case "status":
                        value = contract.status;
                        break;
                    case "startDate":
                        value = contract.startDate ? formatDate(contract.startDate) : "";
                        break;
                    case "totalContractValue":
                        value = contract.totalContractValue ?? "";
                        break;
                    case "clientName":
                        value = clientName;
                        break;
                    case "plotNumber":
                        value = plotNumber;
                        break;
                    default:
                        value = "";
                }

                if (value === null || value === undefined) {
                    row.push("");
                } else if (typeof value === "string") {
                    row.push(`"${value.replace(/"/g, '""')}"`);
                } else {
                    row.push(value as number);
                }
            });

            return row.join(",");
        });

        const csvContent = [headers.join(","), ...csvRows].join("\n");

        const blob = new Blob([csvContent], {
            type: "text/csv;charset=utf-8;",
        });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        link.setAttribute("href", url);
        link.setAttribute(
            "download",
            `contracts_export_${new Date().toISOString().split("T")[0]}.csv`,
        );
        link.style.visibility = "hidden";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    }, [contractsTable]);

    const handleBulkCancel = React.useCallback(
        async (ids?: string[]) => {
            const selectedRows = contractsTable.getFilteredSelectedRowModel().rows;
            const selectedIds =
                ids && ids.length > 0
                    ? ids
                    : selectedRows.map((row) => row.original.id);

            if (selectedIds.length === 0) return;

            setCancellingIds((prev) => {
                const next = new Set(prev);
                selectedIds.forEach((id) => next.add(id));
                return next;
            });
            setIsCancelling(true);

            try {
                for (const id of selectedIds) {
                    const res = await CancelContract({
                        contractId: id,
                        reason: "Cancelled from contracts table (bulk)",
                    });
                    if (!res.success) {
                        throw new Error(res.error);
                    }
                }

                showToast({
                    title: "Contracts cancelled",
                    description: `${selectedIds.length} contract${
                        selectedIds.length > 1 ? "s" : ""
                    } have been cancelled`,
                    variant: "success",
                    showAction: false,
                });

                contractsTable.resetRowSelection();
            } catch (error) {
                console.error("Error cancelling contracts:", error);
                showToast({
                    title: "Error Cancelling Contracts",
                    description:
                        error instanceof Error ? error.message : "An unexpected error occurred",
                    variant: "error",
                    showAction: false,
                });
            } finally {
                setIsCancelling(false);
                setCancellingIds((prev) => {
                    const next = new Set(prev);
                    selectedIds.forEach((id) => next.delete(id));
                    return next;
                });
            }
        },
        [contractsTable, showToast],
    );

    const selectedRowsCount =
        contractsTable.getFilteredSelectedRowModel().rows.length;

    return (
        <div className="data-table-container">
            {/* Shared view sheet (opened from the row dropdown) */}
            <ReusableSheet
                triggerId={viewTriggerId}
                trigger={<span className="hidden" />}
                title="Viewing Contract"
                titleIcon={<SquarePen className="w-5.5 h-5.5" />}
                formContent={
                    viewContract ? <ViewContractForm contractId={viewContract.id} /> : null
                }
                hideFooter
                hideHeader
                popupClass="max-w-full"
            />

            <DataTable
                table={contractsTable}
                emptyTitle={filteredData.length > 0 ? "Add Contract" : "No Contracts found"}
                emptyDescription={
                    filteredData.length > 0
                        ? "No Contracts have been added so far!"
                        : "Your search didn't find the contracts you are looking for!"
                }
                emptyContent={
                    filteredData.length > 0 ? (
                        <ReusableSheet
                            trigger={
                                <Button className="btn-primary">
                                    <Plus />
                                    New Contract
                                </Button>
                            }
                            title="New Contract"
                            titleIcon={<Archive className="w-5.5 h-5.5" />}
                            hideHeader
                            hideFooter
                            popupClass="max-w-full"
                            formContent={<AddContractForm />}
                            saveButtonText="Save Contract"
                        />
                    ) : (
                        ""
                    )
                }
                emptyMedia={filteredData.length > 0 ? <Archive /> : <Search />}
                actionBar={
                    <DataTableActionBar table={contractsTable} className="flex">
                        <Badge variant="outline" className="gap-0 rounded-md px-2 py-1">
                            {selectedRowsCount} Selected
                            <button
                                className="-my-[5px] -ms-0.5 -me-2 inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-[inherit] p-0 text-foreground/60 transition-[color,box-shadow] outline-none hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                aria-label="Clear selection"
                            >
                                <ReusableTooltip
                                    trigger={
                                        <XIcon
                                            size={14}
                                            aria-hidden="true"
                                            onClick={() => contractsTable.resetRowSelection()}
                                        />
                                    }
                                    tooltip="Clear selection"
                                />
                            </button>
                        </Badge>
                        <Separator orientation="vertical" />
                        <ReusableTooltip
                            trigger={
                                <DownloadIcon
                                    onClick={handleDownloadCSV}
                                    className="text-gray-700 size-5 rounded p-0.3 cursor-pointer"
                                />
                            }
                            tooltip={`Export ${
                                selectedRowsCount > 1
                                    ? `${selectedRowsCount} Selected Contracts`
                                    : "Selected Contract"
                            }`}
                        />
                        <ReusableTooltip
                            trigger={
                                <ReusablePopover
                                    trigger={
                                        <Trash2Icon className="text-destructive size-5 rounded p-0.3 cursor-pointer" />
                                    }
                                    title="Confirm Cancel?"
                                    description={`Cancel ${selectedRowsCount} contracts. This action can't be undone`}
                                    content={
                                        <Button
                                            size="sm"
                                            className="px-2 btn-primary"
                                            onClick={() => handleBulkCancel()}
                                            disabled={isCancelling}
                                        >
                                            {isCancelling ? (
                                                <div className="flex gap-2 items-center">
                                                    Deleting <Loader2 className="animate-spin" />
                                                </div>
                                            ) : (
                                                "I'm Sure, Cancel!"
                                            )}
                                        </Button>
                                    }
                                    popoverClass="text-destructive"
                                />
                            }
                            tooltip={`Cancel ${selectedRowsCount} Selected Contracts`}
                        />
                    </DataTableActionBar>
                }
            >
                <DataTableToolbar table={contractsTable} />
            </DataTable>
        </div>
    );
};