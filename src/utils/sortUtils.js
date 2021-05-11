import _ from "lodash";

export function compareAscending(value, other) {
    if (value !== other) {
        const valIsDefined = value !== undefined
        const valIsNull = value === null
        const valIsReflexive = value === value
        const valIsSymbol = _.isSymbol(value)

        const othIsDefined = other !== undefined
        const othIsNull = other === null
        const othIsReflexive = other === other
        const othIsSymbol = _.isSymbol(other)

        const val = typeof value === 'string'
            ? value.localeCompare(other)
            : value - other

        if (
            (!othIsNull && !othIsSymbol && !valIsSymbol && val > 0) ||
            (valIsSymbol && othIsDefined && othIsReflexive && !othIsNull && !othIsSymbol) ||
            (valIsNull && othIsDefined && othIsReflexive) ||
            (!valIsDefined && othIsReflexive) ||
            !valIsReflexive
        ) return 1

        if (
            (!valIsNull && !valIsSymbol && !othIsSymbol && val < 0) ||
            (othIsSymbol && valIsDefined && valIsReflexive && !valIsNull && !valIsSymbol) ||
            (othIsNull && valIsDefined && valIsReflexive) ||
            (!othIsDefined && valIsReflexive) ||
            !othIsReflexive
        ) return -1
    }

    return 0
}
