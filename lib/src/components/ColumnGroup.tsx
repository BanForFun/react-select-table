import useUpdateWhen from '../hooks/useUpdateWhen';
import useRequiredContext from '../hooks/useRequiredContext';
import getTableContext from '../context/tableContext';
import { TableData } from '../utils/configUtils';
import { map } from '../utils/iterableUtils';

function ColGroup<TData extends TableData>() {
    const { state, refs } = useRequiredContext(getTableContext<TData>());

    useUpdateWhen(state.headers.changed);

    return <colgroup ref={refs.headColGroup.set}>
        {Array.from(map(state.headers.leafIterator(), header =>
            <col key={header.id} width={state.headerSizes.get(header) + '%'} />
        ))}
        <col />
    </colgroup>;
}

export default ColGroup;