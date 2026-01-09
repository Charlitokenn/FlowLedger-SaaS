import { DataTableLoading } from '@/components/loading/data-table-loading'

const loading = () => {
  return (
    <DataTableLoading
      columnCount={6}
      rowCount={6}
      filterCount={3}
      cellWidths={["30px", "80px", "200px", "200px", "200px", "50px"]}
    />
  )
}

export default loading