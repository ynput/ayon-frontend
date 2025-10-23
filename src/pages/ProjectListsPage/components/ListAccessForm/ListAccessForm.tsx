import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useListsModuleContext } from '@pages/ProjectListsPage/context/ListsModulesContext'
import {
  EntityListModel,
  useGetActivityCategoriesQuery,
  useGetCurrentUserQuery,
  useGetShareOptionsQuery,
  useUpdateEntityListMutation,
} from '@shared/api'
import { RequiredAddonVersion } from '@shared/components/Powerpack'
import { usePowerpack } from '@shared/context'
import { FC } from 'react'
import { toast } from 'react-toastify'
import { Section } from '../ListDetailsPanel/ListDetailsPanel.styled'

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
  const { data: currentUser } = useGetCurrentUserQuery()
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
