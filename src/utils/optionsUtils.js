export function createTableOptions(options) {
    const defaultOptions = {
        itemParser: item => item,
        itemFilter: () => true,
        minWidth: 3,
        isMultiselect: true,
        deselectOnContainerClick: true
    };

    return _.defaults(options, defaultOptions);
}