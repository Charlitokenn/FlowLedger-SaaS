"use client";

import { type Column, type ColumnDef } from "@tanstack/react-table";
import {
    Archive,
    Loader2,
    MoreHorizontal,
    Plus, Search,
    SquarePen,
    Text,
    Trash2Icon,
    XIcon,
} from "lucide-react";
import {parseAsArrayOf, parseAsString, useQueryState} from "nuqs";
import * as React from "react";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useDataTable } from "@/hooks/use-data-table";
import { formatDate } from "@/lib/format";
import {cn, toProperCase} from "@/lib/utils";
import { DataTableActionBar } from "@/components/data-table/data-table-action-bar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/reusable components/toast-context";
import ReusableTooltip from "@/components/reusable components/reusable-tooltip";
import { SoftDeleteContacts } from "@/lib/actions/tenants/contacts.actions";
import ReusableSheet from "@/components/reusable components/reusable-sheet";
import ReusablePopover from "@/components/reusable components/reusable-popover";
import {Contact} from "@/database/tenant-schema";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DeleteIcon, DownloadIcon, EditIcon, ViewIcon } from "@/components/icons";
import AddContactsForm from "@/components/forms/contacts/add-contact-form";
import EditContactForm from "@/components/forms/contacts/edit-contact-form";
import ViewContactForm from "@/components/forms/contacts/view-contact-form";

export const ContactsTable = ({ data }: { data: Contact[] }) => {
    const { showToast: showContactsToast } = useToast()

    const [viewContact, setViewContact] = React.useState<Contact | null>(null);
    const viewTriggerId = "contact-view-sheet";

    const [fullName] = useQueryState("fullName", parseAsString.withDefault(""));
    const [contactType] = useQueryState("contactType", parseAsArrayOf(parseAsString).withDefault([]),);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [deletingRowIds, setDeletingRowIds] = React.useState<Set<string>>(new Set());
    const [hiddenContactIds, setHiddenContactIds] = React.useState<Set<string>>(new Set());

    // If the page data refreshes (router.refresh / revalidatePath), keep the currently open
    // view sheet in sync with the latest version of the contact from the new `data` prop.
    React.useEffect(() => {
        if (!viewContact) return;
        const next = data.find((p) => p.id === viewContact.id) ?? null;
        if (next && next !== viewContact) {
            setViewContact(next);
        }
    }, [data, viewContact]);
    
    //TODO - Change to server side rendered data and filtering
    const filteredData = React.useMemo<Contact[]>(() => {
        if (!data) return [];

        const contactSearch = fullName?.toLowerCase();

        return data.filter((contact: Contact) => {
            // Optimistically hide rows that have been deleted on the client
            if (hiddenContactIds.has(contact.id)) {
                return false;
            }
            // Client name filter
            if (
                contactSearch &&
                !contact.fullName.toLowerCase().includes(contactSearch)
            ) {
                return false;
            }

            // contact type multi-select filter
            return !(contactType.length > 0 && !contactType.includes(contact.contactType));
        });
    }, [fullName, contactType, data, hiddenContactIds]);

    const handleSingleDelete = React.useCallback(
        async (id: string) => {
            // mark this row as pending delete so we can show a skeleton
            setDeletingRowIds(prev => {
                const next = new Set(prev);
                next.add(id);
                return next;
            });
            try {
                await SoftDeleteContacts([id]);
                // Optimistically hide this row from the table
                setHiddenContactIds(prev => {
                    const next = new Set(prev);
                    next.add(id);
                    return next;
                });
                showContactsToast({
                    title: "Delete Successful",
                    description: "1 Contact has been deleted",
                    variant: "success",
                    showAction: false,
                });
            } catch (error) {
                console.error("Error deleting contact:", error);
                showContactsToast({
                    title: "Error Deleting Contact",
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
        [showContactsToast],
    );

    const columns = React.useMemo<ColumnDef<Contact>[]>(
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
        id: "contactType",
        accessorKey: "contactType",
        header: ({ column }: { column: Column<Contact, unknown> }) => (
            <DataTableColumnHeader column={column} label="Contact Type" />
        ),
        cell: ({ cell, row }) => {
            const value = cell.getValue<Contact["contactType"]>()
            const contact = row.original as Contact;
            if (deletingRowIds.has(contact.id)) {
              return <Skeleton className="h-6 w-28" />;
            }
            return (
                <Badge
                    className={cn(
                        "badge w-18 py-0",
                        value === "CLIENT" ? "bg-green-600" : "bg-muted-foreground" ,
                    )}
                >
                    {toProperCase(value)}
                </Badge>
            );
        },
        meta: {
            label: "Contact Type",
            placeholder: "Filter by Type...",
            variant: "multiSelect",
            options: [
                { label: "Client", value: "CLIENT" },
                { label: "Land Seller", value: "LAND_SELLER" },
                { label: "Auditor", value: "AUDITOR" },
                { label: "ICT Support", value: "ICT SUPPORT" },
                { label: "Stationery", value: "STATIONERY" },
                { label: "Land Surveyor", value: "SURVEYOR" },
            ],
        },
        enableColumnFilter: true,
        enableHiding: false,
    },
    {
        id: "fullName",
        accessorKey: "fullName",
        header: ({ column }: { column: Column<Contact, unknown> }) => (
            <DataTableColumnHeader column={column} label="Contact Name" />
        ),
        cell: ({ cell, row }) => {
            const contact = row.original as Contact;
            if (deletingRowIds.has(contact.id)) {
                return <Skeleton className="h-6 w-28" />;
            }
            return <div>{cell.getValue<Contact["fullName"]>()}</div>;
        },
        meta: {
            label: "Contact Name",
            placeholder: "Search Contact...",
            variant: "text",
            icon: Text,
            searchable: true,
        },
        enableColumnFilter: true,
        enableHiding: false,
    },
    {
        id: "mobileNumber",
        accessorKey: "mobileNumber",
        header: ({ column }: { column: Column<Contact, unknown> }) => (
            <DataTableColumnHeader column={column} label="Mobile" />
        ),
        cell: ({ cell, row }) => {
            const contact = row.original as Contact;
            if (deletingRowIds.has(contact.id)) {
                return <Skeleton className="h-6 w-28" />;
            }
            return <div>{cell.getValue<Contact["mobileNumber"]>()}</div>;
        },
        meta: {
            label: "Mobile Number",
            placeholder: "Search Mobile...",
            variant: "text",
            icon: Text,
            searchable: true,
        },
        enableColumnFilter: false,
        enableHiding: false,
    },
    {
        id: "altMobileNumber",
        accessorKey: "altMobileNumber",
        header: ({ column }: { column: Column<Contact, unknown> }) => (
            <DataTableColumnHeader column={column} label="Alt Mobile" />
        ),
        cell: ({ cell, row }) => {
            const contact = row.original as Contact;
            if (deletingRowIds.has(contact.id)) {
                return <Skeleton className="h-6 w-28" />;
            }
            return <div>{cell.getValue<Contact["altMobileNumber"]>()}</div>;
        },
        meta: {
            label: "Alt Mobile",
            placeholder: "Search Mobile...",
            variant: "text",
            icon: Text,
            searchable: true,
        },
        enableColumnFilter: false,
        enableHiding: false,
    },
    {
        id: "actions",
        cell: function Cell({ row }) {
            const contact = row.original as Contact;
            const editTriggerId = `contact-edit-${contact.id}`;
            const deleteTriggerId = `contact-delete-${contact.id}`;

            return (
                <div className="flex flex-row">
                    {/* Hidden sheet triggers live outside the dropdown so they aren't unmounted when the menu closes */}
                    <ReusableSheet
                        triggerId={editTriggerId}
                        trigger={<span className="hidden" />}
                        title="Editing Contact"
                        titleIcon={<SquarePen className="w-5.5 h-5.5" />}
                        formContent={<EditContactForm contact={contact} />}
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
                                className="p-1 btn-primary w-full"
                                onClick={() => handleSingleDelete(contact.id)}
                                disabled={deletingRowIds.has(contact.id)}
                            >
                                {deletingRowIds.has(contact.id) ? (
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
                                    // Set the selected contact, then open the shared view sheet.
                                    setViewContact(contact);
                                    setTimeout(() => {
                                        const btn = document.querySelector<HTMLButtonElement>(
                                            `[data-sheet-trigger-id='${viewTriggerId}']`,
                                        );

                                        // If it's already open, don't toggle it closed.
                                        const isOpen = btn?.getAttribute("aria-expanded") === "true";
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
            sorting: [{ id: "fullName", desc: false }],
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

        const contacts = selectedRows.map(row => row.original);

        // Get all keys from the first contact and filter out 'isDeleted'
        const headers = Object.keys(contacts[0]).filter(key => key !== 'isDeleted');

        // Convert rows to CSV format
        const csvRows = contacts.map(contact => {
            return headers.map(header => {
                const value = contact[header as keyof Contact];

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
        link.setAttribute("download", `contacts_export_${new Date().toISOString().split('T')[0]}.csv`);
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
            await SoftDeleteContacts(selectedIds);
            // Optimistically hide all deleted rows from the table
            setHiddenContactIds(prev => {
                const next = new Set(prev);
                selectedIds.forEach(id => next.add(id));
                return next;
            });
            showContactsToast({
                title: "Delete Successful",
                description: `${selectedIds.length} contact${selectedIds.length > 1 ? "s" : ""} have been deleted`,
                variant: "success",
                showAction: false,
            });
            // Clear selection after successful delete
            table.resetRowSelection();
        } catch (error) {
            console.error("Error deleting contacts:", error);

            showContactsToast({
                title: "Error Deleting Contacts",
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
    }, [table, showContactsToast]);

    const selectedRowsCount = table.getFilteredSelectedRowModel().rows.length

    return (
        <div className="data-table-container">
            {/* Shared view sheet (opened from the row dropdown) */}
            <ReusableSheet
                triggerId={viewTriggerId}
                trigger={<span className="hidden" />}
                title={viewContact ? `Viewing ${viewContact.fullName}` : "Viewing Contact"}
                titleIcon={<SquarePen className="w-5.5 h-5.5" />}
                formContent={viewContact ? <ViewContactForm contact={viewContact} /> : null }
                hideFooter={true}
                hideHeader={true}
                popupClass="max-w-full"
            />

            <DataTable
                table={table}
                emptyTitle={filteredData.length > 0 ? "Add Contact" : "No Contact found"}
                emptyDescription={filteredData.length > 0 ? "No Contacts have been added so far!" : "Your search didn't find the contacts you are looking for!"}
                emptyContent={
                    filteredData.length > 0 ?
                        <ReusableSheet
                            trigger={<Button className="btn-primary"><Plus />New Contact</Button>}
                            title="New Contact"
                            titleIcon={<Archive className="w-5.5 h-5.5" />}
                            hideHeader={true}
                            hideFooter={true}
                            popupClass="max-w-full"
                            formContent={<AddContactsForm />}
                            saveButtonText="Save Contact"
                        /> : ""
                }
                emptyMedia={filteredData.length > 0 ? <Archive /> : <Search/>}
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
                            tooltip={`Export ${selectedRowsCount > 1 ? `${selectedRowsCount} Selected Contacts` : "Selected Contact" }`}
                        />
                        <ReusableTooltip
                            trigger={
                                <ReusablePopover
                                    trigger={<Trash2Icon className="text-destructive size-5 rounded p-0.3 cursor-pointer" />}
                                    title="Confirm Delete?"
                                    description={`Permanently delete ${selectedRowsCount} contacts. This action can't be undone`}
                                    content={
                                        <Button
                                            size='sm'
                                            className="px-2 btn-primary"
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
                            tooltip={`Delete ${selectedRowsCount} Selected Contacts`}
                        />
                    </DataTableActionBar>
                }
            >
                <DataTableToolbar table={table} />
            </DataTable>
        </div>
    );
}
