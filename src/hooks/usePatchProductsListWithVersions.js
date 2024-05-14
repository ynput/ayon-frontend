import { useDispatch, useSelector } from 'react-redux'
import { ayonApi } from '/src/services/ayon'

const usePatchProductsListWithVersions = ({ projectName }) => {
  const dispatch = useDispatch()
  const folderIds = useSelector((state) => state.context.focused.folders)

  const patchProductsListWithVersions = (versions) => {
    // patch into productsList cache
    return dispatch(
      ayonApi.util.updateQueryData('getProductList', { projectName, folderIds }, (draft) => {
        console.log('patching getProductList')
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
      }),
    )
  }

  return patchProductsListWithVersions
}

export default usePatchProductsListWithVersions
