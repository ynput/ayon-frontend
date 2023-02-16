import { isEmpty, isEqual, xorWith } from 'lodash'

const arrayEquals = (x, y) => isEmpty(xorWith(x, y, isEqual))

export default arrayEquals
