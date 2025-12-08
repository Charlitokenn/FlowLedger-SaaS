"use client";

import type { ColumnDef, Table } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import * as React from "react";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { DataTableAdvancedToolbar } from "@/components/data-table/data-table-advanced-toolbar";
import { DataTableFilterList } from "@/components/data-table/data-table-filter-list";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { DataTableActionBar } from "@/components/data-table/data-table-action-bar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDataTable } from "@/hooks/use-data-table";

/**
 * Configuration options for the reusable data table
 */
export interface ReusableDataTableConfig<TData> {
  // Core data
  data: TData[];
  columns: ColumnDef<TData>[];
  
  // Pagination
  pageCount?: number;
  
  // Table state
  initialState?: {
    sorting?: Array<{ id: Extract<keyof TData, string>; desc: boolean }>;
    pagination?: { pageSize: number; pageIndex: number };
    columnPinning?: { left?: string[]; right?: string[] };
    columnVisibility?: Record<string, boolean>;
  };
  
  // Row identification
  getRowId?: (row: TData) => string;
  
  // Selection
  enableRowSelection?: boolean | ((row: TData) => boolean);
  enableMultiRowSelection?: boolean;
  
  // Actions
  rowActions?: (row: TData) => React.ReactNode;
  bulkActions?: (table: Table<TData>) => React.ReactNode;
  
  // Toolbar
  toolbarVariant?: "standard" | "advanced";
  enableFiltering?: boolean;
  enableSorting?: boolean;
  enableViewOptions?: boolean;
  toolbarSlot?: React.ReactNode;
  
  // Callbacks
  onRowClick?: (row: TData) => void;
  onRowsSelected?: (rows: TData[]) => void;
}

/**
 * Utility function to create selection column
 */
export function createSelectionColumn<TData>(): ColumnDef<TData> {
  return {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        onClick={(e) => e.stopPropagation()}
      />
    ),
    size: 32,
    enableSorting: false,
    enableHiding: false,
  };
}

/**
 * Utility function to create actions column
 */
export function createActionsColumn<TData>(
  renderActions: (row: TData) => React.ReactNode
): ColumnDef<TData> {
  return {
    id: "actions",
    cell: ({ row }) => {
      const actions = renderActions(row.original);
      
      // If custom actions are provided, use them
      if (actions) {
        return actions;
      }
      
      // Default actions dropdown
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuItem>View</DropdownMenuItem>
            <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    size: 32,
    enableSorting: false,
    enableHiding: false,
  };
}

/**
 * Reusable Data Table Component
 * 
 * A comprehensive, feature-rich data table with:
 * - Row selection (single/multi)
 * - Advanced filtering and sorting
 * - Column visibility controls
 * - Pagination
 * - Row actions and bulk actions
 * - Customizable toolbar
 * 
 * @example
 * ```tsx
 * <ReusableDataTable
 *   data={users}
 *   columns={userColumns}
 *   enableRowSelection
 *   rowActions={(row) => <CustomActions user={row} />}
 *   bulkActions={(table) => <BulkDeleteButton table={table} />}
 *   toolbarVariant="advanced"
 * />
 * ```
 */
export function ReusableDataTable<TData extends Record<string, any>>({
  data,
  columns: baseColumns,
  pageCount = Math.ceil(data.length / 10),
  initialState = {},
  getRowId,
  enableRowSelection = false,
  enableMultiRowSelection = true,
  rowActions,
  bulkActions,
  toolbarVariant = "standard",
  enableFiltering = true,
  enableSorting = true,
  enableViewOptions = true,
  toolbarSlot,
  onRowClick,
  onRowsSelected,
}: ReusableDataTableConfig<TData>) {
  // Build columns with optional selection and actions
  const columns = React.useMemo<ColumnDef<TData>[]>(() => {
    const cols: ColumnDef<TData>[] = [];
    
    // Add selection column if enabled
    if (enableRowSelection) {
      cols.push(createSelectionColumn<TData>());
    }
    
    // Add base columns
    cols.push(...baseColumns);
    
    // Add actions column if provided
    if (rowActions) {
      cols.push(createActionsColumn<TData>(rowActions));
    }
    
    return cols;
  }, [baseColumns, enableRowSelection, rowActions]);

  // Initialize table
  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    initialState: {
      sorting: (initialState.sorting || []) as any,
      pagination: initialState.pagination || { pageSize: 10, pageIndex: 0 },
      columnPinning: initialState.columnPinning || { right: rowActions ? ["actions"] : [] },
      columnVisibility: initialState.columnVisibility || {},
    },
    getRowId: getRowId || ((row, index) => row.id || String(index)),
    enableRowSelection: enableRowSelection
      ? enableMultiRowSelection
        ? true
        : (row) => !table.getIsSomeRowsSelected() || row.getIsSelected()
      : false,
  });

  // Handle row selection changes
  React.useEffect(() => {
    if (onRowsSelected) {
      const selectedRows = table.getSelectedRowModel().rows.map(row => row.original);
      onRowsSelected(selectedRows);
    }
  }, [table.getSelectedRowModel().rows, onRowsSelected]);

  // Render toolbar based on variant
  const renderToolbar = () => {
    if (toolbarVariant === "advanced") {
      return (
        <DataTableAdvancedToolbar table={table}>
          {enableFiltering && <DataTableFilterList table={table} />}
          {enableSorting && <DataTableSortList table={table} />}
          {toolbarSlot}
        </DataTableAdvancedToolbar>
      );
    }
    
    return (
      <DataTableToolbar table={table}>
        {enableSorting && <DataTableSortList table={table} />}
        {toolbarSlot}
      </DataTableToolbar>
    );
  };

  // Render action bar if bulk actions are provided
  const renderActionBar = () => {
    if (!bulkActions || !enableRowSelection) return undefined;
    
    return (
      <DataTableActionBar table={table}>
        {bulkActions(table)}
      </DataTableActionBar>
    );
  };

  return (
    <div className="data-table-container">
      <DataTable
        table={table}
        actionBar={renderActionBar()}
      >
        {renderToolbar()}
      </DataTable>
    </div>
  );
}

/**
 * Example usage with type-safe columns
 */
export function createDataTableColumns<TData>() {
  return {
    /**
     * Create a text column with filtering
     */
    text: (config: {
      id: string;
      accessorKey: keyof TData;
      header: string;
      placeholder?: string;
      cell?: (value: any) => React.ReactNode;
    }): ColumnDef<TData> => ({
      id: config.id,
      accessorKey: config.accessorKey as string,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={config.header} label={config.header} />
      ),
      cell: ({ row }) => {
        const value = row.getValue(config.id);
        return config.cell ? config.cell(value) : <div>{String(value)}</div>;
      },
      meta: {
        label: config.header,
        placeholder: config.placeholder || `Search ${config.header.toLowerCase()}...`,
        variant: "text",
      },
      enableColumnFilter: true,
    }),

    /**
     * Create a select column with filtering
     */
    select: (config: {
      id: string;
      accessorKey: keyof TData;
      header: string;
      options: Array<{ 
        label: string; 
        value: string; 
        icon?: React.FC<React.SVGProps<SVGSVGElement>>;
      }>;
      cell?: (value: any) => React.ReactNode;
    }): ColumnDef<TData> => ({
      id: config.id,
      accessorKey: config.accessorKey as string,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={config.header} label={config.header} />
      ),
      cell: ({ row }) => {
        const value = row.getValue(config.id);
        return config.cell ? config.cell(value) : <div className="capitalize">{String(value)}</div>;
      },
      meta: {
        label: config.header,
        variant: "select",
        options: config.options,
      },
      enableColumnFilter: true,
    }),

    /**
     * Create a numeric column with filtering
     */
    number: (config: {
      id: string;
      accessorKey: keyof TData;
      header: string;
      unit?: string;
      cell?: (value: number) => React.ReactNode;
    }): ColumnDef<TData> => ({
      id: config.id,
      accessorKey: config.accessorKey as string,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={config.header} label={config.header} />
      ),
      cell: ({ row }) => {
        const value = row.getValue(config.id) as number;
        return config.cell ? config.cell(value) : <div>{value?.toLocaleString()}</div>;
      },
      meta: {
        label: config.header,
        variant: "number",
        unit: config.unit,
      },
      enableColumnFilter: true,
    }),

    /**
     * Create a date column with filtering
     */
    date: (config: {
      id: string;
      accessorKey: keyof TData;
      header: string;
      cell?: (value: Date) => React.ReactNode;
    }): ColumnDef<TData> => ({
      id: config.id,
      accessorKey: config.accessorKey as string,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={config.header} label={config.header} />
      ),
      cell: ({ row }) => {
        const value = row.getValue(config.id);
        return config.cell
          ? config.cell(value as Date)
          : <div>{new Date(value as any).toLocaleDateString()}</div>;
      },
      meta: {
        label: config.header,
        variant: "date",
      },
      enableColumnFilter: true,
    }),

    /**
     * Create a custom column
     */
    custom: (columnDef: ColumnDef<TData>): ColumnDef<TData> => columnDef,
  };
}