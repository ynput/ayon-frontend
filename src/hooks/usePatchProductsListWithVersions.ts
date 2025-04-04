import { getProductApi } from '@queries/product/getProduct'
import { useAppDispatch, useAppSelector } from '@state/store'

type PatchProductsListWithVersionsProps = {
  projectName?: string
}

// Define type for version object passed to the function
interface Version {
  productId?: string
  versionId: string
  versionStatus?: string
  [key: string]: any // Allow other properties
}

// Define return type for the patcher function
interface PatchResult {
  undo: () => void
  [key: string]: any
}

const usePatchProductsListWithVersions = ({ projectName }: PatchProductsListWithVersionsProps) => {
  const dispatch = useAppDispatch()
  const folderIds = useAppSelector((state) => state.context.focused.folders)

  const patchProductsListWithVersions = (versions: Version[]): PatchResult | undefined => {
    try {
      return dispatch(
        getProductApi.util.updateQueryData(
          'getProductList',
          { projectName, folderIds },
          (draft) => {
            console.log('patching getProductList:', versions)
            versions.forEach((version) => {
              // find product in product list
              const productIndex = draft.findIndex((product) => product.id === version.productId)

              if (productIndex === -1) return

              // merge version data into product
              draft[productIndex] = {
                ...draft[productIndex],
                ...version,
              }
            })
          },
        ),
      )
    } catch (error) {
      return undefined
    }
  }

  return patchProductsListWithVersions
}

export default usePatchProductsListWithVersions
