import { InputText } from 'primereact/inputtext'
import { Button } from 'primereact/button'
import { Password } from 'primereact/password'
import { Dropdown } from 'primereact/dropdown'
import { ProgressSpinner } from 'primereact/progressspinner'

import FolderTypeIcon from './folder-type-icon'

const Spacer = () => <div style={{ flexGrow: 1 }} />

const Shade = (props) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.1)',
        zIndex: 99,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <ProgressSpinner />
    </div>
  )
}

export { InputText, Button, Password, Dropdown, FolderTypeIcon, Spacer, Shade }
