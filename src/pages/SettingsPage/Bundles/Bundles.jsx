import { useState, useMemo } from 'react'
import BundleList from './BundleList'
import BundleDetail from './BundleDetail'

import { Button, Section, Toolbar } from '@ynput/ayon-react-components'

import { useGetBundleListQuery, useDeleteBundleMutation } from '/src/services/bundles'

const Bundles = () => {
  const [selectedBundle, setSelectedBundle] = useState(null)

  const { data: bundleList = [], isLoading } = useGetBundleListQuery()
  const [deleteBundle] = useDeleteBundleMutation()

  const bundleData = useMemo(() => {
    if (!(bundleList && selectedBundle)) {
      return null
    }
    const result = bundleList.find((bundle) => bundle.name === selectedBundle)
    return result
  }, [bundleList, selectedBundle])

  const onDeleteBundle = async () => {
    await deleteBundle(selectedBundle).unwrap()
    setSelectedBundle(null)
  }

  return (
    <main>
      <Section style={{ maxWidth: 600 }}>
        <Toolbar>
          <Button label="New Bundle" icon="add" onClick={() => setSelectedBundle(null)} />
          <Button label="Delete Bundle" icon="delete" onClick={onDeleteBundle} />
        </Toolbar>
        <BundleList
          selectedBundle={selectedBundle}
          setSelectedBundle={setSelectedBundle}
          bundleList={bundleList}
          isLoading={isLoading}
        />
      </Section>

      <BundleDetail bundle={bundleData} />
    </main>
  )
}

export default Bundles
