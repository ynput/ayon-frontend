import { InputText } from 'primereact/inputtext'
import { Button as PrimeButton } from 'primereact/button'
import { Password } from 'primereact/password'
import { Dropdown } from 'primereact/dropdown'
import { ProgressSpinner } from 'primereact/progressspinner'

import { Section, Toolbar, Panel, ScrollArea } from './layout'

// Layout components

const Spacer = (props) => (
  <div
    style={{
      flexGrow: 1,
      display: 'flex',
      justifyContent: 'center',
    }}
  >
    {props.children}
  </div>
)

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
      {props.children || <ProgressSpinner />}
    </div>
  )
}

const TableWrapper = (props) => {
  return (
    <div style={{ flexGrow: 1, position: 'relative' }}>
      <div
        style={{
          position: 'absolute',
          top: 3, // prevent header covering rounded corners of the parent panel
          left: 0,
          right: 0,
          bottom: 0,
          padding: 0,
        }}
      >
        {props.children}
      </div>
    </div>
  )
}

const FormLayout = (props) => {
  const style = {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    ...(props.style || {}),
  }

  return <div style={style}>{props.children}</div>
}

const FormRow = (props) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        flexGrow: 1,
        alignItems: 'center',
        gap: 12,
        //border: '1px solid blue',
      }}
    >
      <div style={{ minWidth: 120 }}>{props.label}</div>
      <div
        style={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'left',
          //border: '1px solid red',
        }}
      >
        {props.children}
      </div>
    </div>
  )
}

// Primereact wrappers

const Button = (props) => {
  return (
    <PrimeButton
      className={`normal-button ${props.className || ''}`}
      disabled={props.disabled}
      onClick={props.onClick}
      tooltip={props.tooltip}
      tooltipOptions={{ position: props.tooltipPosition || 'bottom' }}
    >
      <span className="icon material-symbols-outlined">{props.icon}</span>
      <span className="label">{props.label}</span>
    </PrimeButton>
  )
}

const ToolButton = (props) => {
  return (
    <PrimeButton
      className={`tool-button ${props.className || ''}`}
      disabled={props.disabled}
      onClick={props.onClick}
      tooltip={props.tooltip}
      tooltipOptions={{ position: props.tooltipPosition || 'bottom' }}
    >
      <span className="icon material-symbols-outlined">{props.icon}</span>
    </PrimeButton>
  )
}

const LinkButton = (props) => {
  return (
    <PrimeButton
      className={`p-button-link link-button ${props.className || ''}`}
      disabled={props.disabled}
      onClick={props.onClick}
      tooltip={props.tooltip}
      tooltipOptions={{ position: props.tooltipPosition || 'bottom' }}
    >
      {props.icon && (
        <span className="icon material-symbols-outlined">{props.icon}</span>
      )}
      {props.label && <span className="label">{props.label}</span>}
    </PrimeButton>
  )
}

export {
  InputText,
  Button,
  Password,
  Dropdown,
  Spacer,
  Shade,
  TableWrapper,
  ToolButton,
  LinkButton,
  FormLayout,
  FormRow,
  Section,
  Toolbar,
  Panel,
  ScrollArea,
}
