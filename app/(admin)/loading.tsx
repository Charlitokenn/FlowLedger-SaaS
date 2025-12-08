import { DataTableSkeleton } from '@/components/skeletons/datatable-skeleton'
import { Skeleton } from '@/components/ui/skeleton'

const loading = () => {
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
        columnCount={5}
        withPagination
        withViewOptions
        rowCount={7}
        shrinkZero
        filterCount={3}
        cellWidths={["30px", "200px", "200px", "200px", "50px"]}
      />
    </>
  )
}

export default loading