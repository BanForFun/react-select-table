export function createTableOptions(options) {
    const defaultOptions = {
        itemParser: item => item,
        itemFilter: () => true,
        minWidth: 2
    };

    return _.defaults(options, defaultOptions);
}