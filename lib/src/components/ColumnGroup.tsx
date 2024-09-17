import useUpdateWhen from '../hooks/useUpdateWhen';
import useRequiredContext from '../hooks/useRequiredContext';
import getTableContext from '../context/tableContext';
import { TableData } from '../utils/configUtils';
import { map } from '../utils/iterableUtils';

function ColGroup<TData extends TableData>() {
    const { state } = useRequiredContext(getTableContext<TData>());

    useUpdateWhen(state.headers.changed);

    return <colgroup>
        {Array.from(map(state.headers.leafIterator(), header =>
            <col key={header.id} width={state.headerSizes.get(header) + '%'} />
        ))}
    </colgroup>;
}

export default ColGroup;