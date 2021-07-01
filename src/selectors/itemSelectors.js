import {createSelector} from "reselect";

export const makeGetRowValues = (utils) => createSelector(
    s => s.rows,
    rows => {
        const values = [];
        for (let row of rows) {
            if (!row) break; //For last page
            values.push(utils.getRowValue(row));
        }

        return values;
    }
)
