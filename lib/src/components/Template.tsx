import { TableData } from '../utils/configUtils';
import useRequiredContext from '../hooks/useRequiredContext';
import getTableContext from '../context/tableContext';

interface Props<TData extends TableData> {

}

function Template<TData extends TableData>(props: Props<TData>) {
    const {} = props;

    const { state } = useRequiredContext(getTableContext<TData>());

    return null;
}

export default Template;