import { useEffect, useState, useRef } from 'react'
import { Icon } from '@ynput/ayon-react-components'
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

const getPathnameLabel = (pathname: string): string => {
  const pageTitle = pathname.split('/')[1]

  if (pageTitle?.includes('settings')) return 'Studio settings'
  if (pageTitle?.includes('manageProjects')) return 'Project manager'

  return ''
}

// TODO(YN-0581 / issue #1940): swap project-name crumb to project label (label || name).
const uri2crumbs = (uri: string = '', pathname: string): string[] => {
  const [scope, pathAndQuery = ''] = (uri || '').split('://')
  const [path, query] = pathAndQuery.split('?')
  const crumbs: string[] = path.split('/').filter(Boolean)

  // Add scope-based label
  if (scope?.includes('ayon+settings')) {
    crumbs.unshift(getSettingsScopeLabel(query))
  } else if (scope?.includes('ayon+entity')) {
    crumbs.unshift('Project')
  } else {
    const pathnameLabel = getPathnameLabel(pathname)
    if (pathnameLabel) {
      crumbs.unshift(pathnameLabel)
    } else {
      crumbs.unshift(...pathname.slice(1).split('/').filter(Boolean).map(upperFirst))
    }
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

interface CrumbContext {
  project?: string
  path: string[]
}

// what the pill shows: the project (the switcher), then the path to the selected entity, or the
// crumbs of another URI; the sidebar and the tabs say which page this is
const getCrumbContext = (uri: string, pathname: string): CrumbContext => {
  const [, root, projectName] = pathname.split('/')
  const project = root === 'projects' && projectName ? decodeURIComponent(projectName) : undefined
  if (uri.startsWith('ayon+entity')) {
    const [, entityProject, ...path] = uri2crumbs(uri, pathname)
    return { project: entityProject, path }
  }
  return { project, path: uri ? uri2crumbs(uri, pathname) : [] }
}

interface BreadcrumbsProps {
  /** opens the project switcher; without it the project name is plain text */
  onProjectsClick?: () => void
  projectsOpen?: boolean
}

const Breadcrumbs = ({ onProjectsClick, projectsOpen }: BreadcrumbsProps) => {
  const location = window.location

  const [localUri, setLocalUri] = useState<string>('')
  const [editMode, setEditMode] = useState<boolean>(false)
  // addon settings clear it with null
  const uri = useURIContext().uri ?? ''

  const inputRef = useRef<HTMLInputElement>(null)

  // keep localUri in sync with real uri
  useEffect(() => {
    setLocalUri(uri)
  }, [uri])

  // when editing, focus and select all text
  useEffect(() => {
    if (!editMode) return
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [editMode])

  const goThere = (e?: React.SyntheticEvent) => {
    e?.preventDefault()
    setEditMode(false)

    const target = getUriTargetUrl(localUri.trim(), location)
    if (!target) {
      toast.warning('Unsupported URI')
      setLocalUri(uri)
      return
    }

    // full load so every page reads the new uri fresh on mount
    location.assign(target)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setEditMode(false)
      setLocalUri(uri)
    }
  }

  const { project, path } = getCrumbContext(uri, location.pathname)
  // long entity paths keep the last level, the full path is in the tooltip
  const shownPath = project && path.length > 2 ? ['…', path[path.length - 1]] : path
  const fullText = [project, ...path].filter(Boolean).join(' / ')

  return (
    <Styled.Pill id="context-pill">
      {onProjectsClick ? (
        <Styled.ProjectButton
          onClick={onProjectsClick}
          className={clsx({ open: projectsOpen, choose: !project })}
          aria-haspopup="dialog"
          aria-expanded={!!projectsOpen}
          data-tooltip={project ? 'Switch project' : undefined}
          data-tooltip-delay={500}
        >
          <Icon icon="category" />
          <strong>{project || 'Choose a project'}</strong>
          <Icon icon="expand_more" />
        </Styled.ProjectButton>
      ) : (
        project && (
          <Styled.ProjectButton as="span" style={{ cursor: 'default' }}>
            <Icon icon="category" />
            <strong>{project}</strong>
          </Styled.ProjectButton>
        )
      )}
      {editMode ? (
        <Styled.Form onSubmit={goThere}>
          <input
            value={localUri}
            placeholder="Go to URI..."
            onChange={(e) => setLocalUri(e.target.value)}
            onBlur={() => setEditMode(false)}
            onKeyDown={handleKeyDown}
            ref={inputRef}
            aria-label="URI"
          />
          <Styled.PillButton icon="arrow_forward" onMouseDown={goThere} variant="text" />
        </Styled.Form>
      ) : shownPath.length ? (
        <Styled.Display
          onClick={() => setEditMode(true)}
          data-tooltip={shownPath !== path ? `${fullText} (click to edit the URI)` : 'Click to edit the URI'}
          data-tooltip-delay={500}
        >
          <Styled.Text>
            {project && '/ '}
            {shownPath.join(' / ')}
          </Styled.Text>
        </Styled.Display>
      ) : (
        <Styled.PillButton
          icon="edit"
          onClick={() => setEditMode(true)}
          variant="text"
          data-tooltip="Go to a URI"
        />
      )}
      {!editMode && (
        <Styled.PillButton
          icon="content_copy"
          onClick={() => copyToClipboard(localUri)}
          disabled={!localUri}
          variant="text"
          data-tooltip={localUri ? 'Copy URI' : undefined}
        />
      )}
    </Styled.Pill>
  )
}

export default Breadcrumbs
