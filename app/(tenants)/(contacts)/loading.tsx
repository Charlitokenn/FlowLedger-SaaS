import { DataTableLoading } from '@/components/loading/data-table-loading'

const loading = () => {
  return (
    <DataTableLoading
      columnCount={5}
      rowCount={7}
      filterCount={3}
      cellWidths={["30px", "200px", "200px", "200px", "50px"]}
    />
  )
}

export default loading