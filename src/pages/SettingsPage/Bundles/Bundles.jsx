import { useState, useMemo, useEffect } from 'react'
import BundleList from './BundleList'
import BundleDetail from './BundleDetail'

import { Button, Section, Toolbar } from '@ynput/ayon-react-components'

import { useDeleteBundleMutation, useGetBundleListQuery } from '/src/services/bundles'
import getNewBundleName from './getNewBundleName'
import NewBundle from './NewBundle'

const Bundles = () => {
  const [selectedBundle, setSelectedBundle] = useState(null)
  // set a bundle name to open the new bundle form, plus add any extra data
  const [newBundleOpen, setNewBundleOpen] = useState(null)

  const studioName = 'Ynput'

  const { data: bundleList = [], isLoading } = useGetBundleListQuery({ archived: true })
  const [deleteBundle] = useDeleteBundleMutation()

  // if no bundle selected and newBundleOpen is null, select the first bundle
  useEffect(() => {
    if (!selectedBundle && !newBundleOpen) {
      if (bundleList.length) {
        setSelectedBundle(bundleList[0].name)
      }
    }
  }, [bundleList, selectedBundle, newBundleOpen, setSelectedBundle, setNewBundleOpen])

  const bundleData = useMemo(() => {
    if (!(bundleList && selectedBundle)) {
      return null
    }
    const result = bundleList.find((bundle) => bundle.name === selectedBundle)
    return result
  }, [bundleList, selectedBundle])

  const handleBundleSelect = (name) => {
    setSelectedBundle(name)
    setNewBundleOpen(null)
  }

  const handleNewBundleStart = () => {
    const name = getNewBundleName(studioName, bundleList)
    setNewBundleOpen({ name })
  }

  const handleNewBundleEnd = (name) => {
    setNewBundleOpen(null)
    setSelectedBundle(name)
  }

  const handleDuplicateBundle = (name) => {
    // get the bundle data
    const bundle = bundleList.find((b) => b.name === name)
    if (!bundle) return

    // version up bundle name 01 -> 02
    let newName = name.replace(/(\d+)$/, (match, p1) => {
      return (parseInt(p1) + 1).toString().padStart(2, '0')
    })

    // if there is no xx at the end, add 01
    if (newName === name) {
      newName += '-01'
    }

    setNewBundleOpen({ ...bundle, name: newName })
    setSelectedBundle(null)
  }

  const handleDeleteBundle = async () => {
    await deleteBundle(selectedBundle).unwrap()
    setSelectedBundle(null)
  }

  return (
    <main style={{ overflow: 'hidden' }}>
      <Section style={{ minWidth: 300, maxWidth: 300 }}>
        <Toolbar>
          <Button label="Create new bundle" icon="add" onClick={handleNewBundleStart} />
        </Toolbar>
        <BundleList
          selectedBundle={selectedBundle}
          onBundleSelect={handleBundleSelect}
          bundleList={bundleList}
          isLoading={isLoading}
          onDuplicate={handleDuplicateBundle}
          onDelete={handleDeleteBundle}
        />
      </Section>

      {newBundleOpen ? (
        <NewBundle initBundle={newBundleOpen} onSave={handleNewBundleEnd} />
      ) : (
        <BundleDetail bundle={bundleData} onDuplicate={handleDuplicateBundle} />
      )}
    </main>
  )
}

export default Bundles
