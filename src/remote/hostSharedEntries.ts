// Every @ynput/ayon-frontend-shared entry, loaded together the first time an addon asks for
// one (see hostSharedModules.ts). One module, so the build gets a single extra lazy entry
// instead of one per shared entry, which would split the host's own chunks into many small ones.
// One per build.lib.entry in shared/vite.config.ts, with the same paths
// (tests/unit/hostSharedModules.spec.ts checks).
import * as index from '@shared/index'
import * as api from '@shared/api/index'
import * as components from '@shared/components/index'
import * as util from '@shared/util/index'
import * as hooks from '@shared/hooks/index'
import * as context from '@shared/context/index'
import * as Actions from '@shared/containers/Actions/index'
import * as ContextMenu from '@shared/containers/ContextMenu/index'
import * as DetailsPanel from '@shared/containers/DetailsPanel/index'
import * as Feed from '@shared/containers/Feed/index'
import * as ProjectTreeTable from '@shared/containers/ProjectTreeTable/index'
import * as RepresentationsList from '@shared/containers/RepresentationsList/index'
import * as Slicer from '@shared/containers/Slicer/index'
import * as Views from '@shared/containers/Views/index'
import * as SimpleTable from '@shared/containers/SimpleTable/index'
import * as EntityPickerDialog from '@shared/containers/EntityPickerDialog/index'
import * as ListTable from '@shared/containers/ListTable/index'
import * as NewEntity from '@shared/containers/NewEntity/index'

export const entries: Record<string, unknown> = {
  index,
  api,
  components,
  util,
  hooks,
  context,
  Actions,
  ContextMenu,
  DetailsPanel,
  Feed,
  ProjectTreeTable,
  RepresentationsList,
  Slicer,
  Views,
  SimpleTable,
  EntityPickerDialog,
  ListTable,
  NewEntity,
}
