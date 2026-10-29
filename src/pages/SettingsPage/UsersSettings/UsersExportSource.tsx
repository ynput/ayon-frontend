import { FC, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { dataImportApi, useGetUserPoolsQuery } from '@shared/api'
import type { UserPoolModel } from '@shared/api'
import { TABLE_EXPORT_SEARCH_PARAM, useTableExportContext } from '@shared/context'
import type { TableExportOptions, TableExportScope, TableExportSource } from '@shared/context'
import { isForImport, NOT_IMPORTABLE } from '@shared/containers/TableExport'
import { getUsersTableState, sortUsers } from './tableSorting'

// The export columns of the table's columns (by field), in the table's default order.
// Projects access isn't a table column, it follows the default access.
const USER_COLUMNS: { field: string; key: string; label: string }[] = [
  { field: 'name', key: 'name', label: 'Username' },
  { field: 'attrib.fullName', key: 'attrib.fullName', label: 'Full name' },
  { field: 'attrib.email', key: 'attrib.email', label: 'Email' },
  { field: 'userPool', key: 'user_pool', label: 'License' },
  { field: 'accessLevel', key: 'access_level', label: 'Access level' },
  { field: 'defaultAccessGroups', key: 'default_access_groups', label: 'Default projects access' },
  { field: 'defaultAccessGroups', key: 'access_groups', label: 'Projects access' },
  { field: 'hasPassword', key: 'has_password', label: 'Has password' },
  { field: 'active', key: 'active', label: 'Active' },
  { field: 'inviteSentAt', key: 'invitation', label: 'Invitation' },
]

// what Import CSV needs besides the name to restore the access level it can set
const IMPORT_COLUMNS = ['data.isAdmin', 'data.isDeveloper']

// a stable default while the pools load, so the source isn't rebuilt on every render
const NO_POOLS: UserPoolModel[] = []

// the Power Pack version with the users export
const POWERPACK_VERSION = '1.7.1'

type UsersExportSourceProps = {
  users: { name: string }[] // the table's rows: the users matching the search
  selectedUsers: string[]
}

// Registers the users table for the Power Pack export dialog
const UsersExportSource: FC<UsersExportSourceProps> = ({ users, selectedUsers }) => {
  const tableExport = useTableExportContext()
  const registerSource = tableExport?.registerSource
  // Import CSV only imports users for admins
  const isAdmin = useSelector((state: any) => !!state.user.data.isAdmin)
  const { data: userPools = NO_POOLS } = useGetUserPoolsQuery()

  // the columns Import CSV reads, only fetched while the dialog is open
  const [searchParams] = useSearchParams()
  const { data: importFields } = dataImportApi.useExportFieldsQuery(
    { entityType: 'user' },
    { skip: !isAdmin || !searchParams.has(TABLE_EXPORT_SEARCH_PARAM) },
  )

  const source = useMemo((): TableExportSource => {
    const importKeys = importFields && new Set(importFields.map((field) => field.key))
    const isImportable = (key: string, options: TableExportOptions) =>
      !isAdmin || !isForImport(options) || !importKeys || importKeys.has(key)

    // the table's columns in its order, read when exporting: the table saves its state itself
    const getColumns = () => {
      const { columnOrder = [] } = getUsersTableState()
      const position = (field: string) =>
        columnOrder.includes(field) ? columnOrder.indexOf(field) : columnOrder.length
      // sort is stable: columns the table doesn't list keep the default order
      return USER_COLUMNS.filter(({ key }) => key !== 'user_pool' || userPools.length).sort(
        (a, b) => position(a.field) - position(b.field),
      )
    }

    const getNames = (scope: TableExportScope) => {
      const selected = new Set(selectedUsers)
      const rows = scope === 'selection' ? users.filter(({ name }) => selected.has(name)) : users
      return sortUsers(rows, userPools).map(({ name }) => name)
    }

    return {
      projectName: '',
      canImport: isAdmin,
      importColumnsLabel: 'admin and developer',
      rowSelection: true,
      minPowerpackVersion: POWERPACK_VERSION,
      selectedRowsCount: selectedUsers.length,
      getSkippedColumns: (_scope, options) =>
        getColumns()
          .filter(({ key }) => !isImportable(key, options))
          .map(({ label }) => `${label} ${NOT_IMPORTABLE}`),
      getContent: (scope, options) => {
        const columns: string[] = []
        const columnLabels: Record<string, string> = {}
        for (const { key, label } of getColumns()) {
          if (!isImportable(key, options)) continue
          columns.push(key)
          columnLabels[key] = label
        }
        if (isAdmin && options.includeImportColumns) columns.push(...IMPORT_COLUMNS)
        return { users: { names: getNames(scope) }, columns, columnLabels }
      },
    }
  }, [users, selectedUsers, userPools, importFields, isAdmin])

  useEffect(() => registerSource?.(source), [registerSource, source])

  return null
}

export default UsersExportSource
