import api from '@shared/api'

export interface OAuthClient {
  clientId: string
  clientName: string
  clientSecret?: string
  redirectUris: string[]
  grantTypes: string[]
  responseTypes: string[]
  scope: string
  clientType: 'confidential' | 'public'
  createdAt?: string
  updatedAt?: string
}

export interface CreateOAuthClientRequest {
  clientName: string
  redirectUris: string[]
  grantTypes: string[]
  responseTypes: string[]
  scope: string
  clientType: 'confidential' | 'public'
}

export interface CreateOAuthClientResponse {
  clientId: string
  clientSecret?: string
}

const oauthClientsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getOAuthClients: build.query<OAuthClient[], void>({
      query: () => ({
        url: `/api/oauth/clients`,
        method: 'GET',
      }),
      providesTags: ['oauthClients'],
    }),
    createOAuthClient: build.mutation<CreateOAuthClientResponse, CreateOAuthClientRequest>({
      query: (body) => ({
        url: `/api/oauth/clients`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['oauthClients'],
    }),
    deleteOAuthClient: build.mutation<void, string>({
      query: (clientId) => ({
        url: `/api/oauth/clients/${clientId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['oauthClients'],
    }),
  }),
  overrideExisting: false,
})

export const { useGetOAuthClientsQuery, useCreateOAuthClientMutation, useDeleteOAuthClientMutation } = oauthClientsApi
export { oauthClientsApi }
