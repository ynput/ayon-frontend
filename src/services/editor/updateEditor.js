import { isEmpty } from 'lodash'
import { ayonApi } from '../ayon'
import { nodesUpdated } from '/src/features/editor'

const updateEditor = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    updateEditor: build.mutation({
      query: ({ projectName, updates = [] }) => ({
        url: `/api/projects/${projectName}/operations`,
        method: 'POST',
        body: {
          operations: updates.map((op) => ({
            data: op?.data,
            entityId: op?.entityId,
            entityType: op?.entityType,
            id: op?.id,
            type: op?.type,
          })),
        },
      }),
      invalidatesTags: (result, error, { updates }) =>
        updates.map((op) => ({ type: 'branch', id: op.id })),
      async onCacheEntryAdded({ updates, rootData }, { cacheDataLoaded, dispatch }) {
        try {
          // wait for the initial query to resolve before proceeding
          await cacheDataLoaded

          const updated = []
          const childrenUpdated = []
          const deleted = []

          // create object of updated/new branches
          for (const op of updates) {
            if (op.type === 'delete') {
              deleted.push(op.id)
            } else {
              updated.push(op.patch)
              // find all children of patch
              for (const id in rootData) {
                const childData = rootData[id].data
                if (childData?.__parentId === op.id) {
                  const newAttrib = {}
                  const currentAttrib = childData?.attrib || {}

                  // is childData, check ownAttribs for updates
                  for (const key in op?.data?.attrib) {
                    if (
                      !childData?.ownAttrib?.includes(key) &&
                      currentAttrib[key] !== op.data.attrib[key]
                    ) {
                      newAttrib[key] = op.data.attrib[key]
                    }
                  }

                  if (!isEmpty(newAttrib)) {
                    // add new child to updates
                    childrenUpdated.push({
                      ...rootData[id],
                      data: {
                        ...childData,
                        attrib: { ...currentAttrib, ...newAttrib },
                      },
                    })
                  }
                }
              }
            }
          }

          // for each update check if children attribs need updating
          for (const patch of updated) {
            // find all children of patch
            for (const id in rootData) {
              if (rootData[id].data.__parentId === patch.data.__parentId) {
                // is child, check ownAttribs for updates
              }
            }
          }

          // add new branches to redux editor slice
          dispatch(nodesUpdated({ updated: [...updated, ...childrenUpdated], deleted }))
        } catch (error) {
          console.error(error)
        }
      },
    }),
  }),
})

export const { useUpdateEditorMutation } = updateEditor
