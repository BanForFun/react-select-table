export interface TableData<
    TRow = object,
    TError = NonNullable<unknown>,
    TFilter = NonNullable<unknown>
> {
    row: TRow;
    error: TError;
    filter: TFilter;
}