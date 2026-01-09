import { DataTableLoading } from '@/components/loading/data-table-loading'

const loading = () => {
  return (
    <DataTableLoading
      columnCount={8}
      rowCount={6}
      filterCount={3}
      cellWidths={["30px", "60px", "90px", "100px","100px", "80px", "100px", "40px"]}
    />
  )
}

export default loading