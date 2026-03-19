import api from '@shared/api/base'

export interface FolderProduct {
  id: string
  name: string
  productType: string
  latestVersion: {
    id: string
    version: number
    task: {
      id: string
      name: string
      label: string | null
      taskType: string
    } | null
  } | null
}

const FOLDER_PRODUCTS_QUERY = `
query GetFolderProducts($projectName: String!, $folderId: String!) {
  project(name: $projectName) {
    products(folderIds: [$folderId], first: 1000) {
      edges {
        node {
          id
          name
          productType
          latestVersion {
            id
            version
            task {
              id
              name
              label
              taskType
            }
          }
        }
      }
    }
  }
}
`

interface GetFolderProductsArgs {
  projectName: string
  folderId: string
}

const getFolderProductsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getFolderProducts: build.query<FolderProduct[], GetFolderProductsArgs>({
      query: ({ projectName, folderId }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: FOLDER_PRODUCTS_QUERY,
          variables: { projectName, folderId },
        },
        validateStatus: (response: Response, result: any) =>
          response.status === 200 && !result?.errors?.length,
      }),
      transformErrorResponse: (error: any) => error?.data?.errors?.[0]?.message,
      transformResponse: (response: any): FolderProduct[] => {
        const edges = response?.data?.project?.products?.edges || []
        return edges.map((edge: any) => ({
          id: edge.node.id,
          name: edge.node.name,
          productType: edge.node.productType,
          latestVersion: edge.node.latestVersion
            ? {
                id: edge.node.latestVersion.id,
                version: edge.node.latestVersion.version,
                task: edge.node.latestVersion.task || null,
              }
            : null,
        }))
      },
      providesTags: (result, _e, { folderId }) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'product' as const, id })),
              { type: 'product' as const, id: folderId },
            ]
          : [{ type: 'product' as const, id: folderId }],
    }),
  }),
  overrideExisting: true,
})

export const { useGetFolderProductsQuery } = getFolderProductsApi
