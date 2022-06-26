import { flagGenerator } from '../utils/flagUtils'

const nextFlag = flagGenerator()

export const Filter = nextFlag()
export const SortOrder = nextFlag()
export const Items = nextFlag()
export const Pagination = nextFlag()
export const Active = nextFlag() | Items | Filter | SortOrder
export const Search = nextFlag() | Active
export const Selection = nextFlag() | Items
export const Pivot = nextFlag() | Active | Selection
