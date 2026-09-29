import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useListsModuleContext } from '@pages/ProjectListsPage/context/ListsModulesContext'
import {
  EntityListModel,
  useGetActivityCategoriesQuery,
  useGetShareOptionsQuery,
  useUpdateEntityListMutation,
} from '@shared/api'
import { RequiredAddonVersion } from '@shared/components/Powerpack'
import { useGlobalContext, usePowerpack } from '@shared/context'
import { FC } from 'react'
import { toast } from 'react-toastify'
import { Section } from '../ListDetailsPanel/ListDetailsPanel.styled'
import { copyToClipboard } from '@shared/util'

export interface ListAccessFormProps {
  list: EntityListModel
  projectName: string
  isLoading: boolean
  isReview?: boolean
}

export const ListAccessForm: FC<ListAccessFormProps> = ({
  list,
  projectName,
  isLoading,
  isReview,
}) => {
  //   get current user data
  const { user: currentUser } = useGlobalContext()
  const { powerLicense } = usePowerpack()

  const { data: shareOptions = [], isFetching: isShareOptionsLoading } = useGetShareOptionsQuery(
    {
      projectName,
    },
    { skip: !powerLicense },
  )

  // get comment categories for this project and user
  const { data: categories = [], isLoading: isLoadingCategories } = useGetActivityCategoriesQuery({
    projectName,
  })

  const [updateList] = useUpdateEntityListMutation()

  // load in sharing module
  const {
    ListAccess,
    requiredVersion,
    isLoading: isLoadingModule,
    GuestAccess,
  } = useListsModuleContext()

  const handleCopyLink = () => {
    const path = isReview
      ? `/projects/${projectName}/reviews/${list.id}`
      : `/projects/${projectName}/lists?list=${list.id}`
    copyToClipboard(new URL(path, window.location.origin).toString())
  }

  if (!currentUser) return 'Loading user...'

  if (requiredVersion.access)
    return <RequiredAddonVersion requiredVersion={requiredVersion.access} />

  return (
    <>
      <Section>
        <ListAccess
          {...list}
          isLoading={isLoading || isLoadingModule.access}
          currentUser={currentUser}
          shareOptions={shareOptions}
          isShareOptionsLoading={isShareOptionsLoading}
          onUpdateList={(payload) =>
            updateList({
              listId: list.id as string,
              projectName,
              entityListPatchModel: payload,
            }).unwrap()
          }
          onError={(error) => toast.error(error)}
          onCopyLink={handleCopyLink}
        />
      </Section>
      {isReview && (list.accessLevel || 0) >= 30 && (
        <Section>
          <GuestAccess
            sessionId={list.id as string}
            listData={list?.data || {}}
            isLoading={
              isShareOptionsLoading ||
              isLoadingCategories ||
              isLoading ||
              isLoadingModule.guestAccess
            }
            categories={categories}
            updateList={updateList}
            provider={{
              projectName,
              router: {
                useParams,
                useNavigate,
                useLocation,
                useSearchParams,
              },
              toast,
            }}
          />
        </Section>
      )}
      {isReview && requiredVersion.guestAccess && (
        <RequiredAddonVersion
          requiredVersion={requiredVersion.guestAccess}
          addonName="review"
          addonLabel="Review"
        />
      )}
    </>
  )
}
