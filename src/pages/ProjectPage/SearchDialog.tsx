// shortcut: proof of concept for /api/projects/{project}/search; uses plain axios and inline
// styles, no RTK endpoint, no navigation on click. Replace before shipping.
import { useEffect, useState } from 'react'
import axios from 'axios'
import { Dialog, InputText } from '@ynput/ayon-react-components'

type SearchResult = {
  entityType: string
  entityId: string
  rank: number
  folder?: { name: string; label?: string; path?: string }
  task?: { name: string; label?: string; taskType?: string }
  product?: { name: string; productType?: string }
  version?: { version: number }
  comment?: { body: string; author?: string }
}

const describe = (r: SearchResult) => {
  if (r.entityType === 'comment') return r.comment?.body ?? ''
  if (r.entityType === 'version') {
    const v = r.version?.version ?? 0
    return `${r.product?.name} ${v < 0 ? 'HERO' : `v${String(v).padStart(3, '0')}`}`
  }
  if (r.entityType === 'product') return r.product?.name ?? ''
  if (r.entityType === 'task') return r.task?.label || r.task?.name || ''
  return r.folder?.label || r.folder?.name || ''
}

type Props = { projectName: string; isOpen: boolean; onClose: () => void }

const SearchDialog = ({ projectName, isOpen, onClose }: Props) => {
  const [text, setText] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!text.trim()) return setResults([])
    const controller = new AbortController()
    const timer = setTimeout(() => {
      axios
        .get(`/api/projects/${projectName}/search`, {
          params: { q: text, limit: 50 },
          signal: controller.signal,
        })
        .then((res) => {
          setResults(res.data.results)
          setError(null)
        })
        .catch(
          (err) => !axios.isCancel(err) && setError(String(err?.response?.data?.detail ?? err)),
        )
    }, 200)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [text, projectName])

  return (
    <Dialog
      header="Search (P.O.C.)"
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      style={{ width: 800 }}
    >
      <InputText
        autoFocus
        value={text}
        placeholder="Search folders, tasks, products, versions, comments..."
        onChange={(e) => setText(e.target.value)}
        style={{ width: '100%' }}
      />
      {error && <div style={{ color: 'var(--md-sys-color-error)', padding: 8 }}>{error}</div>}
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: '8px 0',
          maxHeight: '60vh',
          overflow: 'auto',
        }}
      >
        {results.map((r) => (
          <li
            key={r.entityId}
            style={{
              padding: '6px 4px',
              borderBottom: '1px solid var(--md-sys-color-outline-variant)',
            }}
          >
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ opacity: 0.6, width: 70, flexShrink: 0 }}>{r.entityType}</span>
              <span
                style={{
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {describe(r)}
              </span>
              <span style={{ opacity: 0.4 }}>{r.rank.toFixed(2)}</span>
            </div>
            <div style={{ opacity: 0.6, fontSize: 12, marginLeft: 78 }}>
              {r.folder?.path}
              {r.task && r.entityType !== 'task' && ` / ${r.task.name}`}
              {r.comment?.author && ` · ${r.comment.author}`}
            </div>
          </li>
        ))}
      </ul>
    </Dialog>
  )
}

export default SearchDialog
