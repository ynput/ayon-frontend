import { useGetVersionsByProductsQuery, useGetVersionsInfiniteQuery } from '@shared/api'
import { flattenInfiniteVersionsData } from '@shared/api/queries/versions/versionsUtils'
import { Icon, SwitchButton } from '@ynput/ayon-react-components'
import { FC, useRef, useState } from 'react'

interface VersionsPageProps {
  projectName: string
}

const VersionsPage: FC<VersionsPageProps> = ({ projectName }) => {
  const [stacked, setStacked] = useState(false)
  // which versions are expanded
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const {
    currentData: data,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useGetVersionsInfiniteQuery({ projectName, latest: stacked })
  const allVersions = flattenInfiniteVersionsData(data)

  const expandedVersionsProductIds = Array.from(
    new Set(allVersions.filter((v) => expanded[v.id]).map((v) => v.productId)),
  )
  const { data: childVersions } = useGetVersionsByProductsQuery({
    projectName,
    productIds: expandedVersionsProductIds,
  })

  const containerRef = useRef<HTMLDivElement>(null)

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    const scrolledToBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 200

    if (scrolledToBottom && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{ height: '100%', overflow: 'auto', padding: 20, boxSizing: 'border-box' }}
    >
      <SwitchButton label="Stacked View" value={stacked} onClick={() => setStacked(!stacked)} />

      <ul>
        {allVersions.map((version) => (
          <li
            key={version.id}
            style={{
              marginBottom: 10,
              listStyleType: 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {stacked && (
                <Icon
                  icon={'arrow_right'}
                  style={{
                    transform: expanded[version.id] ? 'rotate(90deg)' : 'rotate(0deg)',
                    cursor: 'pointer',
                    fontSize: 25,
                  }}
                  onClick={() =>
                    setExpanded((prev) => ({ ...prev, [version.id]: !prev[version.id] }))
                  }
                />
              )}
              {version.name} - {version.parents.join(', ')}
            </div>
            {stacked && expanded[version.id] && (
              <ul style={{ marginLeft: 20, marginTop: 5 }}>
                {childVersions?.versions
                  .filter((v) => v.productId === version.productId)
                  .map((v) => (
                    <li key={v.id}>
                      {v.name} - {v.parents.join(', ')}
                    </li>
                  ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default VersionsPage
