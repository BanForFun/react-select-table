import { Controller } from '../index';
import TableHead from './TableHead';
import TableBody from './TableBody';

interface Props<TRow, TFilter> {
    controller: Controller<TRow, TFilter>;
}

export default function Table<TRow, TFilter>({ controller }: Props<TRow, TFilter>) {
    return <div className="rst-scrollingContainer">
        <TableHead controller={controller} />
        <TableBody />
    </div>;
}