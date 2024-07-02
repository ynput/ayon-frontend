import { useDispatch, useSelector } from 'react-redux'
import api from '@api'

const usePatchProductsListWithVersions = ({ projectName }) => {
  const dispatch = useDispatch()
  const folderIds = useSelector((state) => state.context.focused.folders)

  const patchProductsListWithVersions = (versions) => {
    try {
      return dispatch(
        api.util.updateQueryData('getProductList', { projectName, folderIds }, (draft) => {
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
        }),
      )
    } catch (error) {
      return null
    }
  }

  return patchProductsListWithVersions
}

export default usePatchProductsListWithVersions
