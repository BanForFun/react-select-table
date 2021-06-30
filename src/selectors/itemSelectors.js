import {createSelector} from "reselect";

export const makeGetRowValues = (options) => createSelector(
    s => s.rows,
    rows => {
        const values = [];
        for (let row of rows) {
            if (!row) break; //For last page
            values.push(row[options.valueProperty]);
        }

        return values;
    }
)
