import { Button, Dialog, Section } from '@ynput/ayon-react-components'
import { toast } from 'react-toastify'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import { useListAddonsQuery, useListBundlesQuery, useUpdateBundleMutation } from '@shared/api'
import { useMemo, useState } from 'react'
import { transformAddonsWithBundles } from './helpers'
import AddonsManagerTable from './AddonsManagerTable'
import useGetTableData from './useGetTableData'
import type { TableDataItem } from './useGetTableData'
import { useAppDispatch, useAppSelector } from '@state/store'
import { onSelectedAddons, onSelectedBundles, onSelectedVersions } from '@state/addonsManager'
import { useNavigate } from 'react-router-dom'
import { useDeleteAddonVersionsMutation } from '@shared/api'
import { useRestart } from '@context/RestartContext'
import { Link } from 'react-router-dom'
import AddonDialog from '@components/AddonDialog/AddonDialog'
import Shortcuts from '@containers/Shortcuts'

// Types
interface ContextMenuItem {
  label: string
  command: () => void
  icon: string
}

interface ShortcutItem {
  key: string
  action: () => void
}

const AddonsManager = (): JSX.Element => {
  const navigate = useNavigate()
  // QUERIES
  const { data: { addons = [] } = {}, isLoading } = useListAddonsQuery({})
  const { data: { bundles = [] } = {} } = useListBundlesQuery({ archived: false })

  // addon upload dialog
  const [uploadOpen, setUploadOpen] = useState('')

  // addonsVersionsBundles = Map<addon, Map<version, Map<bundle, bundle>>>
  const addonsVersionsBundles = useMemo(
    () => transformAddonsWithBundles(addons, bundles),
    [bundles, addons],
  )

  // MUTATIONS
  const [updateBundle] = useUpdateBundleMutation()
  const [deleteAddonVersions] = useDeleteAddonVersionsMutation()

  // SELECTION STATES (handled in redux)
  const dispatch = useAppDispatch()

  const selectedAddons = useAppSelector((state) => state.addonsManager.selectedAddons)
  const selectedVersions = useAppSelector((state) => state.addonsManager.selectedVersions)
  const selectedBundles = useAppSelector((state) => state.addonsManager.selectedBundles)

  const setSelectedAddons = (addons: string[]) => dispatch(onSelectedAddons(addons))
  const setSelectedVersions = (versions: string[]) => dispatch(onSelectedVersions(versions))
  const setSelectedBundles = (bundles: string[]) => dispatch(onSelectedBundles(bundles))
  const [deletedVersions, setDeletedVersions] = useState<string[]>([])

  // "<addonName> <version>" of the version whose API docs dialog is open
  const [docsVersion, setDocsVersion] = useState<string | null>(null)
  const [docsAddonName, docsAddonVersion] = (docsVersion || '').split(' ')

  // different functions to transform the data for each table
  let { addonsTableData, versionsTableData, bundlesTableData, filteredVersionsMap, versionSort } =
    useGetTableData(addonsVersionsBundles, selectedAddons, selectedVersions, deletedVersions)

  // SELECTION HANDLERS vvv
  const handleVersionSelect = (versions: string[]) => {
    setSelectedVersions(versions)

    // remove bundles that are not in the selected versions
    const newBundles = selectedBundles.filter((b: string) =>
      selectedVersions.some((v: string) => filteredVersionsMap.get(v)?.has(b)),
    )

    setSelectedBundles(newBundles)
  }

  const handleAddonsSelect = (addons: string[]) => {
    setSelectedAddons(addons)

    // remove versions that are not in the selected addons
    const newVersions = selectedVersions.filter((v: string) =>
      addons.some((a: string) => v.includes(a)),
    )
    handleVersionSelect(newVersions)
  }
  // SELECTION HANDLERS ^^^

  // DELETE HANDLERS vvv
  // Note: we don't use any try/catch here because confirm delete catches errors and displays them
  const handleBundlesArchive = async (selected: string[] = []): Promise<void> => {
    const bundleMap = new Map(bundles.map((bundle) => [bundle.name, bundle]))

    const updatePromises = selected.map((bundleName: string) => {
      const bundleData = bundleMap.get(bundleName)
      if (!bundleData || bundleData.isProduction || bundleData.isStaging || bundleData.isDev) return
      return updateBundle({ bundleName: bundleName, bundlePatchModel: { isArchived: true } })
    })

    await Promise.all(updatePromises)
  }

  const handleDeleteVersions = async (versions: string[] = []): Promise<void> => {
    console.log('delete versions', versions)
    const addonsToDelete: Array<{ name: string; version: string }> = []
    for (const version of versions) {
      const addonName = version.split(' ')[0]
      const addonVersion = version.split(' ')[1]
      // check addonName and addonVersion exist
      const addon = addons.find((a) => a.name === addonName)
      const addonVersionExists = Object.entries(addon?.versions || {}).some(
        ([v]) => v === addonVersion,
      )

      if (addonVersionExists) {
        addonsToDelete.push({ name: addonName, version: addonVersion })
      }
    }

    await deleteAddonVersions({ addons: addonsToDelete }).unwrap()
  }
  // DELETE HANDLERS ^^^

  // RESTART SERVER
  const { restartRequired } = useRestart()
  const restartServer = (): void => {
    // restart server and remove deleted versions from deletedVersions state after confirmation
    restartRequired({ callback: () => setDeletedVersions([]) })
  }

  // DELETE SUCCESS HANDLERS vvv
  const handleDeleteVersionsSuccess = async (versions: string[] = []): Promise<void> => {
    console.log('delete versions success', versions)
    // remove versions from selectedVersions
    const newVersions = selectedVersions.filter((v: string) => !versions.includes(v))
    setSelectedVersions(newVersions)
    // add versions to deletedVersions state
    setDeletedVersions([...deletedVersions, ...versions])
    // ask if they want to restart the server for the changes to take effect
    restartServer()
  }

  // DELETE SUCCESS HANDLERS ^^^

  const viewInMarket = (selected: string[]): ContextMenuItem[] => [
    {
      label: 'View in Market',
      command: () => navigate(`/market?selected=${selected[0].split(' ')[0]}`),
      icon: 'store',
    },
  ]

  // api-docs route only exists for addons that expose a REST API, so probe before opening
  const openApiDocs = async (versionString: string) => {
    const [addonName, addonVersion] = versionString.split(' ')
    try {
      const res = await fetch(`/api/addons/${addonName}/${addonVersion}/api-docs`)
      if (!res.ok) throw new Error()
      setDocsVersion(versionString)
    } catch {
      toast.error('This addon version has no API documentation')
    }
  }

  const versionContext = (selected: string[]): ContextMenuItem[] => [
    ...viewInMarket(selected),
    {
      label: 'API Docs',
      command: () => openApiDocs(selected[0]),
      icon: 'description',
    },
  ]

  const shortcuts: ShortcutItem[] = [
    {
      key: 'a',
      action: () => setUploadOpen('addon'),
    },
  ]

  const loadingData: TableDataItem[] = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => ({
      key: i,
      data: {},
      status: [], // Required property for TableDataItem
    }))
  }, [])

  // LOADING DUMMY DATA - cast to any[] to work with the table component
  if (isLoading) {
    addonsTableData = loadingData as any[]
    versionsTableData = loadingData as any[]
    bundlesTableData = loadingData as any[]
  }

  return (
    <Section style={{ overflow: 'hidden' }}>
      <Shortcuts shortcuts={shortcuts as any} />
      <Splitter style={{ height: '100%', padding: 8 }}>
        <SplitterPanel>
          <AddonDialog
            uploadOpen={uploadOpen}
            setUploadOpen={setUploadOpen}
            uploadHeader={null}
            manager={true}
          />
          {/* ADDONS TABLE */}
          <AddonsManagerTable
            title="Addons"
            value={addonsTableData as any}
            selection={selectedAddons}
            onChange={handleAddonsSelect}
            field={'name'}
            header={
              <div style={{ display: 'flex', gap: '4px' }}>
                <Button
                  onClick={() => setUploadOpen('addon')}
                  data-shortcut="A"
                  data-tooltip="Upload addon zip files"
                  label="Upload Addons"
                  icon="upload"
                  style={{ width: '100%' }}
                />
                <Link to="/market" style={{ width: '100%' }}>
                  <Button label="Addon Market" icon="store" style={{ width: '100%' }} />
                </Link>
              </div>
            }
            extraContext={viewInMarket}
            emptyMessage="No addons found"
            isLoading={isLoading}
            onDelete={undefined}
            onDeleteSuccess={undefined}
            sortFunction={undefined}
          />
        </SplitterPanel>
        <SplitterPanel>
          {/* VERSIONS TABLE */}
          <AddonsManagerTable
            title="Versions"
            value={versionsTableData as any}
            selection={selectedVersions}
            onChange={handleVersionSelect}
            field={'version'}
            sortFunction={versionSort}
            onDelete={handleDeleteVersions}
            onDeleteSuccess={handleDeleteVersionsSuccess}
            extraContext={versionContext}
            emptyMessage={selectedAddons.length ? 'No versions found' : 'Select an addon'}
            isLoading={isLoading}
            header={null}
          />
        </SplitterPanel>
        <SplitterPanel>
          {/* BUNDLES TABLE */}
          <AddonsManagerTable
            title="Bundles"
            value={bundlesTableData as any}
            selection={selectedBundles}
            onChange={setSelectedBundles}
            field={'name'}
            onDelete={handleBundlesArchive}
            isArchive
            extraContext={(sel: string[]) => [
              {
                label: 'View bundle',
                command: () => navigate(`/settings/bundles?bundle=${sel[0]}`),
                icon: 'arrow_circle_right',
              },
            ]}
            emptyMessage={selectedVersions.length ? 'No bundles found' : 'Select versions'}
            isLoading={isLoading}
            header={null}
            onDeleteSuccess={undefined}
            sortFunction={undefined}
          />
        </SplitterPanel>
        {/* <SplitterPanel>
          <Section style={{ height: '100%' }}>
            <h2 style={{ margin: 0, paddingTop: 8 }}>Addon Upload</h2>
            <AddonUpload type="addon" dropOnly />
            <h2 style={{ margin: 0 }}>Dependency Package Upload</h2>
            <AddonUpload type="package" dropOnly />
            <h2 style={{ margin: 0 }}>Installer Upload</h2>
            <AddonUpload type="installer" dropOnly />
          </Section>
        </SplitterPanel> */}
      </Splitter>

      {docsVersion && (
        <Dialog
          isOpen
          onClose={() => setDocsVersion(null)}
          size="full"
          header={`${docsAddonName} ${docsAddonVersion} — API Docs`}
          footer={
            <a
              href={`/api/addons/${docsAddonName}/${docsAddonVersion}/api-docs`}
              target="_blank"
              rel="noreferrer"
            >
              <Button variant="tonal" icon="open_in_new">
                Open in new tab
              </Button>
            </a>
          }
        >
          <iframe
            src={`/api/addons/${docsAddonName}/${docsAddonVersion}/api-docs`}
            title="Addon API documentation"
            style={{ width: '100%', height: '100%', minHeight: '75vh', border: 'none' }}
          />
        </Dialog>
      )}
    </Section>
  )
}

export default AddonsManager
