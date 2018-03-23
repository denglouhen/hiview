import { createAction } from 'redux-actions'

export const SELECT_NODE = 'SELECT_NODE'
export const DESELECT_NODE = 'DESELECT_NODE'

export const ENTER_NODE = 'ENTER_NODE'

export const selectNode = createAction(SELECT_NODE)
export const deselectNode = createAction(DESELECT_NODE)

export const enterNode = createAction(ENTER_NODE)
