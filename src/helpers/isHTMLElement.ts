export default (target: EventTarget | null): target is HTMLElement => {
  return target instanceof HTMLElement
}
