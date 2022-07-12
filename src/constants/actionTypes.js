const types = {
  // Items
  SET_ITEMS: '',
  ADD_ITEMS: '',
  DELETE_ITEMS: '',
  PATCH_ITEMS: '',
  PATCH_ITEMS_BY_KEY: '',
  CLEAR_ITEMS: '',
  SORT_ITEMS: '',
  SET_ITEM_FILTER: '',

  // Displaying
  SET_ERROR: '',
  START_LOADING: '',

  // Selection
  SET_SELECTED: '',
  SELECT: '',
  CLEAR_SELECTION: '',
  SELECT_ALL: '',
  SET_ACTIVE: '',

  // Search
  SEARCH: '',
  GO_TO_MATCH: '',

  // Pagination
  SET_PAGE_SIZE: '',

  DEBUG: ''
}

// Set action types
for (const name in types)
  types[name] = `RST_${name}`

export default Object.freeze(types)
