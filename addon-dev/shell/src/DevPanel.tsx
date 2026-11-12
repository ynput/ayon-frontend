// The developer panel: Places (top), every place of AYON (by area) and of the contract packages
// that has a slot this addon uses (all of them with Show all), and Slots (bottom), a read-only
// overview of the selected place's slots with this addon's contributions to each. A place opens
// the UI around all its slots on the stage; Highlight slots marks them there. Each half scrolls on
// its own. Everything here is also settable from the URL (params.ts).
import { useState } from 'react'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import { Button, Icon, InputSwitch, InputText } from '@ynput/ayon-react-components'
import { contributionTitle, getRegistry } from '@ynput/ayon-addon/host'
import { useGetCurrentUserQuery } from '@ynput/ayon-frontend-shared/api'
import { clearAccessToken } from '@ynput/ayon-frontend-shared/util'
import { setHighlightedSlot, useSlotHighlight } from '@ynput/ayon-frontend-shared/components'
import { contributionsTo, getPlace, getPlaces, getUsedSlots } from './catalog'
import { getContracts } from './contractModel'
import { AYON_AREAS, AYON_SOURCE, packageTitle, panelListing, placeSummary } from './places'
import type { Place, PlaceSlot } from './places'
import { rememberedSceneValues } from './params'
import { hiddenReason } from './slotNeeds'
import type { ShellOptions, ShellSelection } from './types'

interface DevPanelProps {
  options: ShellOptions
  mode: 'live' | 'preview'
  selection: ShellSelection
  /** the search box, shared with the stage's Other slots */
  search: string
  onSearch: (search: string) => void
  onChange: (selection: ShellSelection) => void
}

const titles = (slot: string) => contributionsTo(slot).map((c) => contributionTitle(c))

/** What Places lists, with each place's slots (panelListing): the same rule for both halves. */
const listing = (selection: ShellSelection, search: string) =>
  panelListing(getPlaces(), getUsedSlots(), !!selection.showAll, search, titles, selection.surface)

/** The slots Slots lists for a place: those its row in Places stands for. */
export const slotsHere = (place: Place | undefined, selection: ShellSelection, search: string): PlaceSlot[] =>
  (place && listing(selection, search).find((listed) => listed.place.id === place.id)?.slots) || []

const PlaceRow = ({
  place,
  selected,
  used,
  onClick,
}: {
  place: Place
  selected: boolean
  used: ReadonlySet<string>
  onClick: () => void
}) => {
  const summary = placeSummary(place, used, contributionsTo('app.service').length)
  const unused = summary === 'Unused' || summary === 'No preview'
  return (
    <button
      className={`contribution ayon-shell-place${selected ? ' selected' : ''}${unused ? ' unused' : ''}`}
      data-shell-place={place.id}
      title={place.scene?.description || place.label}
      onClick={onClick}
    >
      <Icon icon={place.icon as never} />
      <span>{place.label}</span>
      <small>{summary}</small>
    </button>
  )
}

/** "Places", with a search icon at the right that opens the search box. */
const PlacesHeader = ({ search, onSearch }: Pick<DevPanelProps, 'search' | 'onSearch'>) => {
  const [open, setOpen] = useState(!!search)
  const shown = open || !!search
  return (
    <>
      <div className="ayon-shell-section-header">
        <h3>Places</h3>
        <Button
          icon="search"
          variant="text"
          className="ayon-shell-icon-button"
          aria-label="Search places or slots"
          data-shell-action="search"
          selected={shown}
          onClick={() => {
            if (shown) onSearch('')
            setOpen(!shown)
          }}
        />
      </div>
      {shown && (
        <InputText
          className="ayon-shell-search"
          value={search}
          placeholder="Search places or slots"
          autoFocus
          data-shell-search
          onChange={(e) => onSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Escape') return
            onSearch('')
            setOpen(false)
          }}
          onBlur={() => {
            if (!search) setOpen(false)
          }}
        />
      )}
    </>
  )
}

const Switch = ({
  label,
  action,
  title,
  checked,
  onChange,
}: {
  label: string
  action: string
  title: string
  checked: boolean
  onChange: (checked: boolean) => void
}) => (
  <label className="ayon-shell-toggle" data-shell-action={action} title={title}>
    <InputSwitch checked={checked} onChange={(e) => onChange((e.target as HTMLInputElement).checked)} />
    {label}
  </label>
)

const Places = ({ options, selection, search, onSearch, onChange, onPick }: DevPanelProps & { onPick: (selection: ShellSelection) => void }) => {
  const used = getUsedSlots()
  const showAll = !!selection.showAll
  const found = listing(selection, search).map(({ place }) => place)
  const sources = [...new Set(found.map((place) => place.source))]
  const problems = [
    ...(options.contractProblems || []),
    ...getContracts().flatMap((contract) => contract.problems.map((problem) => `${contract.package}: ${problem}`)),
    ...getRegistry().skipped.map((s) => `${s.slot} ${s.id}: ${s.reason}`),
  ]
  const nothingUsed = !getRegistry().contributions.length
  const pick = (place: Place) =>
    onPick({
      ...selection,
      surface: place.id,
      // the contribution of `ayon-addon open` was in the place it opened
      slot: undefined,
      id: undefined,
      // a scene's values are its own, as last set there; AYON's places share the project and entities
      sceneValues: !place.scene
        ? undefined
        : place.id === selection.surface
        ? selection.sceneValues
        : rememberedSceneValues(place.id),
    })
  const rows = (list: Place[]) =>
    list.map((place) => (
      <PlaceRow
        key={place.id}
        place={place}
        used={used}
        selected={place.id === selection.surface}
        onClick={() => pick(place)}
      />
    ))
  return (
    <>
      <PlacesHeader search={search} onSearch={onSearch} />
      <div className="ayon-shell-toggles">
        <Switch
          label="Show all"
          action="show-all"
          title="List every place and slot, also those this addon doesn't use."
          checked={showAll}
          onChange={(checked) => onChange({ ...selection, showAll: checked })}
        />
      </div>
      {nothingUsed && !showAll && !found.length && !search.trim() && (
        <small className="ayon-shell-note">This addon has no contributions yet. Turn on Show all to explore.</small>
      )}
      {search && !found.length && <small className="ayon-shell-note">No places or slots match your search.</small>}
      {sources.map((source) => {
        const inSource = found.filter((place) => place.source === source)
        const areas = source === AYON_SOURCE ? AYON_AREAS.filter((area) => inSource.some((p) => p.area === area)) : []
        return (
          <div key={source || 'other'} className="ayon-shell-places" data-shell-source={source}>
            {/* AYON's places need no heading: their areas (Studio, Project, ...) head them */}
            {source && source !== AYON_SOURCE && (
              <div className="ayon-shell-slot-label" title={`Slots of another addon, from ${source}`}>
                {packageTitle(source)}
              </div>
            )}
            {areas.length
              ? areas.map((area) => (
                  <div key={area} className="ayon-shell-area-group" data-shell-area={area}>
                    <div className="ayon-shell-area-label">{area}</div>
                    {rows(inSource.filter((place) => place.area === area))}
                  </div>
                ))
              : rows(inSource)}
          </div>
        )
      })}
      {problems.length > 0 && (
        <section className="ayon-shell-area">
          <div className="ayon-shell-slot-label">Loading problems</div>
          {problems.map((problem) => (
            <div key={problem} className="ayon-addon-error" role="alert">
              {problem}
            </div>
          ))}
        </section>
      )}
    </>
  )
}

/** A slot and, nested under it, this addon's contributions to it: an overview, nothing to pick. */
const SlotRow = ({
  place,
  slot,
  selection,
  showStatus,
  hovered,
}: {
  place: Place
  slot: PlaceSlot
  selection: ShellSelection
  showStatus: boolean
  hovered: boolean
}) => {
  const contributions = contributionsTo(slot.slot)
  return (
    <div
      className={`ayon-shell-slot-entry${contributions.length ? '' : ' empty'}${hovered ? ' hovered' : ''}`}
      data-shell-slot={slot.slot}
      onMouseEnter={() => setHighlightedSlot(slot.slot)}
      onMouseLeave={() => setHighlightedSlot(undefined)}
    >
      <div className="ayon-shell-slot-head" title={slot.description ? `${slot.label}: ${slot.description}` : slot.label}>
        <span className="ayon-shell-slot-title">
          <span>{slot.label}</span>
          <small>{slot.slot}</small>
        </span>
        {showStatus && <small className="ayon-shell-status">{contributions.length ? 'Used' : 'Unused'}</small>}
      </div>
      {contributions.map((c) => {
        const hidden = hiddenReason(c, place.id, selection)
        const icon = (c as { icon?: string }).icon
        return (
          <div
            key={c.key}
            className="ayon-shell-slot-contribution"
            data-contribution={`${c.slot}:${(c as { id?: string }).id}`}
            title={hidden ? `Not shown with these inputs. ${hidden}` : (c as { id?: string }).id}
          >
            <Icon icon={(icon || 'subdirectory_arrow_right') as never} />
            <span>{contributionTitle(c)}</span>
            {hidden && <small>Not shown with these inputs</small>}
          </div>
        )
      })}
    </div>
  )
}

const Slots = ({ selection, search, onChange }: Pick<DevPanelProps, 'selection' | 'search' | 'onChange'>) => {
  const { hovered } = useSlotHighlight()
  const place = getPlace(selection.surface)
  const slots = slotsHere(place, selection, search)
  return (
    <>
      <div className="ayon-shell-section-header">
        <h3>Slots</h3>
        <Switch
          label="Highlight"
          action="highlight"
          title="Highlight slots: mark every slot of the place in the preview, a placeholder where an unused slot is, an outline around what a used one shows and around the buttons that open menus with a slot."
          checked={!!selection.highlight}
          onChange={(checked) => onChange({ ...selection, highlight: checked })}
        />
      </div>
      {!place ? (
        <small className="ayon-shell-note">Select a place.</small>
      ) : (
        <>
          {slots.map((slot) => (
            <SlotRow
              key={slot.slot}
              place={place}
              slot={slot}
              selection={selection}
              showStatus={!!selection.showAll}
              hovered={hovered === slot.slot}
            />
          ))}
          {!slots.length && (
            <small className="ayon-shell-note">
              {search.trim()
                ? 'No places or slots match your search.'
                : place.slots.length
                ? 'This addon uses none of these slots. Turn on Show all to list them.'
                : 'No slots here.'}
            </small>
          )}
        </>
      )}
    </>
  )
}

const LiveStatus = ({ options }: { options: ShellOptions }) => {
  const { data: user } = useGetCurrentUserQuery()
  // signed in on the page: the dev server then sends no key (proxyApiKey)
  const withKey = options.signedInWithKey && !localStorage.getItem('accessToken')
  return (
    <small title={`${user?.name} at ${options.serverUrl}`}>
      {user?.name} @ {options.serverUrl.replace(/^https?:\/\//, '')}
      {withKey ? ' · API key' : ''}
      {!withKey && (
        <>
          {' · '}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              clearAccessToken()
              window.location.reload()
            }}
          >
            sign out
          </a>
        </>
      )}
    </small>
  )
}

export const DevPanel = (props: DevPanelProps) => {
  const { options, mode, selection } = props
  // in preview another place opens live: the fixture is for one contribution
  const onPick =
    mode === 'preview'
      ? (next: ShellSelection) => {
          const params = new URLSearchParams()
          if (next.surface) params.set('surface', next.surface)
          if (next.showAll) params.set('showAll', '1')
          if (next.highlight) params.set('highlight', '1')
          window.location.href = `?${params}`
        }
      : props.onChange
  return (
    <aside className="ayon-shell-panel" data-shell-surface="dev-panel">
      <header className="ayon-shell-panel-header">
        <Icon icon="extension" />
        <div>
          <strong>
            {options.addon.name} <span>{options.addon.version}</span>
          </strong>
          {mode === 'live' ? (
            <LiveStatus options={options} />
          ) : (
            <small>Preview: dev/fixtures/{selection.preview}.json, no server</small>
          )}
        </div>
      </header>
      {/* two scrolls: the places and the selected place's slots are always both in view */}
      <Splitter
        layout="vertical"
        className="ayon-shell-panel-split"
        stateKey="ayon-addon-shell-places"
        stateStorage="local"
      >
        <SplitterPanel size={50} minSize={10} className="ayon-shell-section">
          <Places {...props} onPick={onPick} />
        </SplitterPanel>
        <SplitterPanel size={50} minSize={10} className="ayon-shell-section">
          <Slots selection={selection} search={props.search} onChange={props.onChange} />
        </SplitterPanel>
      </Splitter>
    </aside>
  )
}
