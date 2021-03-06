import { createAction } from 'redux-actions'

export const LOCAL_SEARCH_STARTED = 'LOCAL_SEARCH_STARTED'
export const LOCAL_SEARCH_SUCCEEDED = 'LOCAL_SEARCH_SUCCEEDED'
export const LOCAL_SEARCH_FAILED = 'LOCAL_SEARCH_FAILED'

export const CLEAR_SEARCH_RESULTS = 'CLEAR_SEARCH_RESULTS'

export const localSearchStarted = createAction(LOCAL_SEARCH_STARTED)
export const localSearchSucceeded = createAction(LOCAL_SEARCH_SUCCEEDED)
export const localSearchFailed = createAction(LOCAL_SEARCH_FAILED)

export const clearSearchResults = createAction(CLEAR_SEARCH_RESULTS)

