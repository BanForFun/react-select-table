import _ from "lodash";
import {createSelector} from "reselect";

export const makeGetParsedItems = (options) => createSelector(
    s => s.items,
    items => _.map(items, options.itemParser)
)

export const makeGetFilteredItems = (getParsed, options) => createSelector(
    getParsed,
    s => s.filter,
    (parsed, filter) => filter
        ? _.filter(parsed, item => options.itemPredicate(item, filter))
        : parsed
)

export const makeGetSortedItems = (getFiltered) => createSelector(
    getFiltered,
    s => s.sortBy,
   (filtered, sortBy) => _.orderBy(filtered, _.keys(sortBy), _.values(sortBy))
)

export const makeGetSortedValues = (getSorted, options) => createSelector(
    getSorted,
    sorted => _.map(sorted, options.valueProperty)
)

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

export const makeGetItemCount = (getFiltered) => s =>
    getFiltered(s).length;

export const makeGetItemValue = (getValues) => (s, index) =>
    getValues(s)[index];
