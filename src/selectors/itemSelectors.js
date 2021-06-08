import _ from "lodash";
import {createSelector} from "reselect";

//Legacy
export const makeGetParsedItems = (options) => createSelector(
    s => s.items,
    items => _.map(items, options.itemParser)
)

//Legacy
export const makeGetFilteredItems = (getParsed, options) => createSelector(
    getParsed,
    s => s.filter,
    (parsed, filter) => filter
        ? _.filter(parsed, item => options.itemPredicate(item, filter))
        : parsed
)

//Legacy
export const makeGetSortedItems = (getFiltered) => createSelector(
    getFiltered,
    s => s.sortAscending,
   (filtered, sortAscending) =>
       _.orderBy(filtered, _.keys(sortAscending), _.values(sortAscending).map(asc => asc ? "asc" : "desc"))
)

//Legacy
export const makeGetSortedValues = (getSorted, options) => createSelector(
    getSorted,
    sorted => _.map(sorted, options.valueProperty)
)

export const makeGetRowValues = (options) => createSelector(
    s => s.rows,
    rows => _.map(rows, options.valueProperty)
)

function createSelectorRef(selector) {
    const ref = {};

    return s => {
        ref.current = selector(s);
        return ref;
    }
}

//Legacy
export const makeGetSearchIndex = (getSorted, options) => createSelector(
    getSorted,
    sorted => {
        const {indexProperty, itemIndexer} = options;
        if (!indexProperty) return {};

        const index = {};
        for (let i = 0; i < sorted.length; i++) {
            const indexValue = itemIndexer(_.get(sorted[i], indexProperty));
            const currentIndex = index[indexValue];
            if (currentIndex)
                currentIndex.push(i);
            else
                index[indexValue] = [i];
        }

        return index;
    }
)

