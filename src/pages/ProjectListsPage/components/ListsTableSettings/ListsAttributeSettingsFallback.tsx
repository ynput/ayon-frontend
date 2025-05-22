import PowerpackButton from '@components/Powerpack/PowerpackButton'
import { ListsAttributesContextValue } from '@pages/ProjectListsPage/context/ListsAttributesContext'
import { ConfirmDeleteOptions } from '@shared/util'
import { Button } from '@ynput/ayon-react-components'
import { FC } from 'react'
import { Link } from 'react-router-dom'

export interface ListsAttributeSettingsFallbackProps {
  listAttributes: ListsAttributesContextValue['listAttributes']
  entityAttribFields: ListsAttributesContextValue['entityAttribFields']
  isLoadingNewList: ListsAttributesContextValue['isLoadingNewList']
  isUpdating: ListsAttributesContextValue['isUpdating']
  requiredVersion: string | undefined
  updateAttributes: ListsAttributesContextValue['updateAttributes']
  onGoTo: (name: string) => void
  onSuccess?: (message: string) => void
  onError?: (error: string) => void
  confirmDelete?: (options: ConfirmDeleteOptions) => void
}

const ListsAttributeSettingsFallback: FC<ListsAttributeSettingsFallbackProps> = ({
  requiredVersion,
}) => {
  if (requiredVersion) {
    return (
      <>
        <span>{`Powerpack version ${requiredVersion} is required to use this feature.`}</span>
        <Link to={`/market?selected=powerpack`} style={{ marginLeft: '8px' }}>
          <Button variant="tertiary">Install Powerpack {requiredVersion}</Button>
        </Link>
      </>
    )
  }

  return (
    <PowerpackButton
      style={{ width: '100%' }}
      icon={'add'}
      label="Add attribute"
      feature={'listAttributes'}
      filled
    />
  )
}

export default ListsAttributeSettingsFallback
