import { useEffect, useState, useRef } from 'react'
import { Button, InputText } from '@ynput/ayon-react-components'
import * as Styled from './Breadcrumbs.styled'

import { upperFirst } from 'lodash'
import { toast } from 'react-toastify'
import { copyToClipboard, parseUri } from '@shared/util'
import { URL_PARAM_ID, useURIContext } from '@shared/context'
import { Module, ModulePath } from '@pages/ProjectManagerPage/mappers'
import clsx from 'clsx'

const parseQueryParams = (query: string): Record<string, string> => {
  if (!query) return {}

  const params: Record<string, string> = {}
  const urlParams = new URLSearchParams(query)

  urlParams.forEach((value, key) => {
    params[key] = decodeURIComponent(value)
  })

  return params
}

const getSettingsScopeLabel = (query: string): string => {
  return query?.includes('project') ? 'Project manager' : 'Studio settings'
}

const getSettingsPathname = ({ project, site }: { project?: string; site?: string }): string => {
  if (project) return ModulePath[site ? Module.siteSettings : Module.projectSettings]
  return site ? '/settings/site' : '/settings/studio'
}

// pages whose details panel opens context entities (DetailsPanelContext) from the uri
const ENTITY_MODULES = ['overview', 'tasks', 'browser', 'products']

const canShowEntity = (projectName: string, pathname: string): boolean => {
  if (pathname.startsWith('/dashboard/tasks')) return true
  const module = pathname.split('/')[3]
  return pathname.startsWith(`/projects/${projectName}/`) && ENTITY_MODULES.includes(module)
}

// the uri state is in-memory only, so a full reload must carry it in the url
const getUriTargetUrl = (uri: string, location: Location): string | null => {
  const { type, settings, entity } = parseUri(uri)

  if (type === 'settings' && settings) {
    const params = new URLSearchParams()
    params.set(URL_PARAM_ID, uri)
    if (settings.project) params.set('project', settings.project)
    return `${getSettingsPathname(settings)}?${params}`
  }

  // the details panel has no product resolution
  if (type !== 'entity' || !entity?.projectName || entity.entityType === 'product') return null

  const stay = canShowEntity(entity.projectName, location.pathname)
  const params = new URLSearchParams(stay ? location.search : '')
  params.set(URL_PARAM_ID, uri)
  params.set('project', entity.projectName)
  const pathname = stay ? location.pathname : `/projects/${entity.projectName}/overview`
  return `${pathname}?${params}`
}

// route segments named like the nav and tabs that lead to them
const SECTION_LABELS: Record<string, string> = {
  dashboard: 'Home',
  projects: 'Project',
  settings: 'Studio settings',
  manageProjects: 'Project manager',
}
const MODULE_LABELS: Record<string, Record<string, string>> = {
  projects: { tasks: 'Task progress', reviews: 'Review', scheduler: 'Schedule' },
  account: { downloads: 'Launchers' },
  settings: {
    server: 'Global',
    studio: 'Studio settings',
    site: 'Site settings',
    anatomyPresets: 'Anatomy presets',
    accessGroups: 'Permissions',
  },
  manageProjects: {
    projectSettings: 'Project settings',
    permissions: 'Project permissions',
    projectAccess: 'Project access',
    siteSettings: 'Site settings',
  },
}

const pathname2crumbs = (pathname: string): string[] => {
  const [section, ...rest] = pathname.split('/').filter(Boolean)
  if (!section) return []
  const sectionLabel = SECTION_LABELS[section] || upperFirst(section)
  // the project name is an identifier, shown as it is
  const projectName = section === 'projects' ? rest.shift() : undefined
  const modules = rest
    .filter((segment) => segment !== 'addon')
    .map((segment) => MODULE_LABELS[section]?.[segment] || upperFirst(segment))
    // the "Studio settings" tab of Studio settings is not repeated
    .filter((label) => label !== sectionLabel)
  return [sectionLabel, ...(projectName ? [projectName] : []), ...modules]
}

const COLLAPSED_CRUMB = '…'

// an entity opens inside a page: the page keeps its crumbs so the module stays visible, then the
// entity's project and path
const getEntityPrefix = (projectName: string, pathname: string): string[] => {
  if (pathname.startsWith(`/projects/${projectName}/`)) return pathname2crumbs(pathname)
  if (pathname.startsWith('/projects/')) return ['Project', projectName]
  return [...pathname2crumbs(pathname), projectName]
}

// TODO(YN-0581 / issue #1940): swap project-name crumb to project label (label || name).
const uri2crumbs = (uri: string = '', pathname: string, collapse = false): string[] => {
  const [scope, pathAndQuery = ''] = (uri || '').split('://')
  const [path, query] = pathAndQuery.split('?')
  const crumbs: string[] = path.split('/').filter(Boolean)

  // Add scope-based label
  if (scope?.includes('ayon+settings')) {
    crumbs.unshift(getSettingsScopeLabel(query))
  } else if (scope?.includes('ayon+entity')) {
    const [projectName = '', ...folders] = crumbs
    // deep folder paths keep the leaf folder, the full path is in the tooltip and the uri
    const shownFolders =
      collapse && folders.length > 2 ? [COLLAPSED_CRUMB, folders[folders.length - 1]] : folders
    crumbs.splice(0, crumbs.length, ...getEntityPrefix(projectName, pathname), ...shownFolders)
  } else {
    crumbs.unshift(...pathname2crumbs(pathname))
  }

  // Add query parameter breadcrumbs
  const queryParams = parseQueryParams(query)
  const queryLevels = ['product', 'task', 'workfile', 'version', 'representation']

  queryLevels.forEach((level) => {
    if (queryParams[level]) {
      crumbs.push(queryParams[level])
    }
  })

  return crumbs
}

const Breadcrumbs = () => {
  const location = window.location

  const [localUri, setLocalUri] = useState<string>('')
  const [editMode, setEditMode] = useState<boolean>(false)
  const { uri = '' } = useURIContext()

  const inputRef = useRef<HTMLInputElement>(null)

  // keep localUri in sync with real uri
  useEffect(() => {
    setLocalUri(uri)
  }, [uri])

  //   when editing, select all text
  useEffect(() => {
    if (!editMode) return
    inputRef.current?.select()

    // reselect to counter mouse movement
    const timeout = setTimeout(() => {
      inputRef.current?.select()
    }, 50)

    // reselect again to really make sure
    const timeout2 = setTimeout(() => {
      inputRef.current?.select()
    }, 400)

    return () => {
      clearTimeout(timeout)
      clearTimeout(timeout2)
    }
  }, [editMode])

  const goThere = (e?: React.SyntheticEvent) => {
    e?.preventDefault()
    setEditMode(false)
    // blur input
    inputRef.current?.blur()

    const target = getUriTargetUrl(localUri.trim(), location)
    if (!target) {
      toast.warning('Unsupported URI')
      setLocalUri(uri)
      return
    }

    // full load so every page reads the new uri fresh on mount
    location.assign(target)
  }

  const onCopy = () => {
    copyToClipboard(localUri)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // if escape, cancel edit mode
    if (['Escape', 'Enter'].includes(e.key)) {
      setEditMode(false)
      setLocalUri(uri)
      inputRef.current?.blur()
    }
    if (e.key === 'Enter') {
      goThere(e)
    }
  }

  const uriDisplay = uri2crumbs(uri, location.pathname, true).join(' / ')
  const uriFullDisplay = uri2crumbs(uri, location.pathname).join(' / ')
  const inputValue = editMode ? localUri : uriDisplay || 'Go to URI...'

  return (
    <Styled.Wrapper>
      <Styled.Crumbtainer>
        <Styled.CrumbsForm onSubmit={goThere} className={clsx({ noUri: !uriDisplay || !localUri })}>
          {uriDisplay && localUri && (
            <Button
              icon="edit"
              style={{
                padding: editMode ? 0 : '6px',
                opacity: editMode ? 0 : 1,
                width: editMode ? 0 : 'auto',
              }}
              onClick={(e) => {
                e.preventDefault()
                setEditMode(true)
              }}
              variant="tonal"
            />
          )}
          <label data-value={inputValue}>
            <InputText
              value={inputValue}
              onChange={(e) => setLocalUri(e.target.value)}
              onBlur={() => setEditMode(false)}
              onFocus={() => setEditMode(true)}
              onKeyDown={handleKeyDown}
              ref={inputRef}
              style={{ borderRadius: '4px 0 0 4px' }}
              data-tooltip={!editMode && uriFullDisplay !== uriDisplay ? uriFullDisplay : undefined}
              data-tooltip-position="bottom"
            />
          </label>
          <Button
            icon="arrow_forward"
            style={{
              display: editMode ? 'inline-flex' : 'none',
              borderRadius: '0 4px 4px 0',
            }}
            onMouseDown={goThere}
            variant="tonal"
          />
        </Styled.CrumbsForm>
        {uriDisplay && localUri && (
          <Button
            icon="content_copy"
            style={{ display: editMode ? 'none' : 'inline-flex' }}
            onClick={onCopy}
            variant="tonal"
          />
        )}
      </Styled.Crumbtainer>
    </Styled.Wrapper>
  )
}

export default Breadcrumbs
