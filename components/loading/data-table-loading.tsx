import { DataTableSkeleton } from '@/components/skeletons/datatable-skeleton'
import { Skeleton } from '@/components/ui/skeleton'

interface Props {
    columnCount: number,
    rowCount: number,
    filterCount: number,
    cellWidths: string[]
}

export const DataTableLoading = ({ columnCount, rowCount, filterCount, cellWidths }: Props) => {
    return (
        <>
            <div className="flex justify-between items-start mb-4.5">
                <div>
                    <Skeleton className="h-8 w-24 mb-2" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-10 w-32" />
            </div>
            <DataTableSkeleton
                columnCount={columnCount}
                withPagination
                withViewOptions
                rowCount={rowCount}
                shrinkZero
                filterCount={filterCount}
                cellWidths={cellWidths}
            />
        </>
    )
}