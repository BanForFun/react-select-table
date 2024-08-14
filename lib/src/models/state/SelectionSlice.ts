import { TableData } from '../../utils/configUtils';
import RowSlice from './RowSlice';
import StateSlice from '../StateSlice';

interface Dependencies<TData extends TableData> {
    rows: RowSlice<TData>;
}

export default class SelectionSlice<TData extends TableData> extends StateSlice<object, Dependencies<TData>> {


}