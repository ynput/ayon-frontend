// The developer panel: Places (top), every place of AYON and of the contract packages that has a
// slot this addon uses (all of them with Show unused slots), and Slots here (bottom), the slots of
// the selected place with this addon's contributions to each. A place opens the UI around its
// slots on the stage; a slot or a contribution is a focus inside it. Each half scrolls on its own.
// Everything here is also settable from the URL (params.ts), for `ayon-addon open`.
import { Splitter, SplitterPanel } from 'primereact/splitter'
import { Icon, InputSwitch, InputText } from '@ynput/ayon-react-components'
import { contributionTitle, getRegistry } from '@ynput/ayon-addon/host'
import type { AnyContribution, SlotName } from '@ynput/ayon-addon'
import { useGetCurrentUserQuery } from '@ynput/ayon-frontend-shared/api'
import { clearAccessToken } from '@ynput/ayon-frontend-shared/util'
import { contributionsTo, getPlace, getPlaces, getUsedSlots, idOf } from './catalog'
import { getContracts } from './contractModel'
import { AYON_SOURCE, listedPlaces, listedSlots, placeSummary, searchPlaces } from './places'
import type { Place, PlaceSlot } from './places'
import { hiddenReason } from './slotNeeds'
import { highlightSlot, useSlotOverlay } from './slotOverlay'
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

/** The slots Slots here lists for a place: used ones, all with Show unused slots, those the search left. */
export const slotsHere = (place: Place | undefined, selection: ShellSelection, search: string): PlaceSlot[] => {
  if (!place) return []
  const used = getUsedSlots()
  const listed = listedSlots(place, used, !!selection.showUnused, selection.slot)
  const found = searchPlaces([place], search, titles)[0]?.slots
  return listed.filter((s) => s.slot === selection.slot || !found || found.includes(s))
}

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

const Places = ({ options, mode, selection, search, onSearch, onChange }: DevPanelProps) => {
  const used = getUsedSlots()
  const showUnused = !!selection.showUnused
  const places = listedPlaces(getPlaces(), used, showUnused, selection.surface)
  const found = searchPlaces(places, search, titles).map(({ place }) => place)
  const sources = [...new Set(found.map((place) => place.source))]
  const problems = [
    ...(options.contractProblems || []),
    ...getContracts().flatMap((contract) => contract.problems.map((problem) => `${contract.package}: ${problem}`)),
    ...getRegistry().skipped.map((s) => `${s.slot} ${s.id}: ${s.reason}`),
  ]
  const nothingUsed = !getRegistry().contributions.length
  const pick = (place: Place) =>
    onChange({
      ...selection,
      surface: place.id,
      slot: undefined,
      id: undefined,
      // a scene's values are its own; AYON's places share the project and entities
      sceneValues: place.scene && place.id === selection.surface ? selection.sceneValues : undefined,
    })
  return (
    <>
      <h3>Places</h3>
      <InputText
        className="ayon-shell-search"
        value={search}
        placeholder="Search places or slots"
        data-shell-search
        onChange={(e) => onSearch(e.target.value)}
      />
      <label
        className="ayon-shell-toggle"
        data-shell-action="show-unused"
        title="List unused slots and mark their locations in the preview."
      >
        <InputSwitch
          checked={showUnused}
          disabled={mode === 'preview'}
          onChange={(e) => onChange({ ...selection, showUnused: (e.target as HTMLInputElement).checked })}
        />
        Show unused slots
      </label>
      {showUnused && (
        <small className="ayon-shell-note">Includes AYON slots and slots declared by loaded packages.</small>
      )}
      {nothingUsed && !showUnused && !places.length && (
        <small className="ayon-shell-note">
          This addon has no contributions yet. Turn on Show unused slots to explore.
        </small>
      )}
      {search && !found.length && <small className="ayon-shell-note">No places or slots match your search.</small>}
      {sources.map((source) => (
        <div key={source || 'other'} className="ayon-shell-places" data-shell-source={source}>
          {sources.length > 1 && source && (
            <div className="ayon-shell-slot-label" title={source === AYON_SOURCE ? undefined : `Slots of another addon, from ${source}`}>
              {source}
            </div>
          )}
          {found
            .filter((place) => place.source === source)
            .map((place) => (
              <PlaceRow
                key={place.id}
                place={place}
                used={used}
                selected={place.id === selection.surface}
                onClick={() => pick(place)}
              />
            ))}
        </div>
      ))}
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

const SlotRow = ({
  place,
  slot,
  selection,
  showStatus,
  hovered,
  onChange,
}: {
  place: Place
  slot: PlaceSlot
  selection: ShellSelection
  showStatus: boolean
  hovered: boolean
  onChange: (selection: ShellSelection) => void
}) => {
  const contributions = contributionsTo(slot.slot)
  const focused = selection.slot === slot.slot
  const focus = (contribution?: AnyContribution) =>
    onChange({ ...selection, slot: slot.slot as SlotName, id: contribution ? idOf(contribution) : undefined })
  return (
    <div
      className={`ayon-shell-scene-slot${contributions.length ? '' : ' empty'}${hovered ? ' hovered' : ''}`}
      data-shell-slot={slot.slot}
      onMouseEnter={() => highlightSlot(slot.slot)}
      onMouseLeave={() => highlightSlot(undefined)}
    >
      <button
        className={`contribution ayon-shell-slot-row${focused && !selection.id ? ' selected' : ''}`}
        title={slot.description ? `${slot.label}: ${slot.description}` : slot.label}
        onClick={() => focus()}
      >
        <span className="ayon-shell-slot-title">
          <span>{slot.label}</span>
          <small>{slot.slot}</small>
        </span>
        {showStatus && <small className="ayon-shell-status">{contributions.length ? 'Used' : 'Unused'}</small>}
      </button>
      {contributions.length > 0 && (
        <div className="ayon-shell-chips">
          {contributions.map((c) => {
            const hidden = hiddenReason(c, place.id, selection)
            return (
              <button
                key={c.key}
                className={`ayon-shell-contribution-chip${focused && selection.id === idOf(c) ? ' selected' : ''}`}
                data-contribution={`${c.slot}:${idOf(c)}`}
                title={hidden ? `Not shown with these inputs. ${hidden}` : idOf(c)}
                onClick={() => focus(c)}
              >
                {contributionTitle(c)}
                {hidden && <small> · Not shown with these inputs.</small>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

const SlotsHere = ({ selection, search, onChange }: Pick<DevPanelProps, 'selection' | 'search' | 'onChange'>) => {
  const { highlighted } = useSlotOverlay()
  const place = getPlace(selection.surface)
  const slots = slotsHere(place, selection, search)
  return (
    <>
      <h3>Slots here</h3>
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
              showStatus={!!selection.showUnused}
              hovered={highlighted === slot.slot}
              onChange={onChange}
            />
          ))}
          {!slots.length && (
            <small className="ayon-shell-note">
              {search.trim()
                ? 'No places or slots match your search.'
                : place.slots.length
                ? 'This addon uses none of these slots. Turn on Show unused slots to list them.'
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
  // in preview another place or focus opens live: the fixture is for one contribution
  const onChange =
    mode === 'preview'
      ? (next: ShellSelection) => {
          const params = new URLSearchParams()
          if (next.surface) params.set('surface', next.surface)
          if (next.slot) params.set('slot', next.slot)
          if (next.slot && next.id) params.set('contribution', next.id)
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
          <Places {...props} onChange={onChange} />
        </SplitterPanel>
        <SplitterPanel size={50} minSize={10} className="ayon-shell-section">
          <SlotsHere selection={selection} search={props.search} onChange={onChange} />
        </SplitterPanel>
      </Splitter>
    </aside>
  )
}
