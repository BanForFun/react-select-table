import { createState, withContext, simpleColumn, Table, Column } from 'react-select-table';
import 'react-select-table/index.css';
import './App.css';
import { useEffect, useRef } from 'react';

type Duration = [string, string] | undefined;

interface Lesson {
    id: string;
    name: string;
    monday?: Duration,
    tuesday?: Duration,
    wednesday?: Duration,
    thursday?: Duration,
    friday?: Duration,
    saturday?: Duration,
    sunday?: Duration
}

function renderDuration(duration: Duration) {
    if (!duration) return null;
    return `${duration[0]} - ${duration[1]}`;
}

function compareStart(a: Duration, b: Duration) {
    if (a === b) return 0;
    if (!a) return 1;
    if (!b) return -1;

    return a[0].localeCompare(b[0]);
}

function lessonColumn(header: string): Column<Duration> {
    return {
        header,
        render: renderDuration,
        compareContext: compareStart
    };
}

const state = createState<Lesson>({
    headerSizes: {
        defaultColumnWidthPercentage: 20
    },
    rows: {
        getRowKey: l => l.id
    },
    columns: [
        withContext(l => l.id, simpleColumn('Code', { isHeader: true, allowSorting: true })),
        withContext(l => l.name, simpleColumn('Name', { allowSorting: true })),
        {
            header: 'Weekdays', children: [
                withContext(l => l.monday, lessonColumn('Monday')),
                withContext(l => l.tuesday, lessonColumn('Tuesday')),
                withContext(l => l.wednesday, lessonColumn('Wednesday')),
                withContext(l => l.thursday, lessonColumn('Thursday')),
                withContext(l => l.friday, lessonColumn('Friday'))
            ]
        },
        {
            header: 'Weekend', children: [
                withContext(l => l.saturday, lessonColumn('Saturday')),
                withContext(l => l.sunday, lessonColumn('Sunday'))
            ]
        }
        // { header: 'r3,c1', render: () => 'c1' },
        // {
        //     header: 'r1,c2-3',
        //     children: [
        //         {
        //             header: 'r2,c2',
        //             children: [{ header: 'r3,c2', render: () => 'c2' }]
        //         },
        //         { header: 'r3,c3', render: () => 'c3' }
        //     ]
        // },
        // {
        //     header: 'r1,c4-5',
        //     children: [
        //         { header: 'r3,c4', render: () => 'c4' },
        //         {
        //             header: 'r2,c5',
        //             children: [{ header: 'r3,c5', render: () => 'c5' }]
        //         }
        //     ]
        // }
    ]
});

state.page.setSize(20);

for (let i = 0; i < state.columns.config.length; i++)
    state.headers.add([i], []);

state.sortOrder.sortBy([0], 'ascending', false);

state.rows.add([
    {
        id: 'HY-120',
        name: 'Digital design',
        monday: ['13:00', '15:00'],
        wednesday: ['13:00', '15:00'],
        friday: ['13:00', '15:00']
    },
    {
        id: 'HY-345',
        name: 'Operating systems',
        tuesday: ['14:00', '16:00'],
        thursday: ['14:00', '16:00']
    }
]);

const testRows = Array.from({ length: 100 }, (_, i) => {
    const id = i + 1;
    return { id: `TST-${id.toString().padStart(3, '0')}`, name: 'Test ' + id };
});

state.rows.add(testRows);

state.history.clear();

function parseColumnPathInput(input?: string) {
    if (!input) return [];
    return input.split(' ').map(c => parseInt(c));
}


function App() {
    const nextIdRef = useRef(1);

    const columnPathInputRef = useRef<HTMLInputElement>(null);
    const headerPathInputRef = useRef<HTMLInputElement>(null);
    const pageSizeInputRef = useRef<HTMLInputElement>(null);
    const pageIndexInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => state.rows.pageIndexChanged.addObserver(() => {
        if (pageIndexInputRef.current)
            pageIndexInputRef.current.value = state.rows.pageIndex.toString();
    }), []);

    useEffect(() => state.page.sizeChanged.addObserver(() => {
        if (pageSizeInputRef.current)
            pageSizeInputRef.current.value = state.page.size.toString();
    }), []);

    const addLesson = () => {
        const id = nextIdRef.current++;

        state.rows.add([{
            id: `ADD-${id.toString().padStart(3, '0')}`,
            name: 'Added ' + id
        }]);
    };

    const removeFirst = () => {
        const firstRow = state.rows.iterator().next();
        if (firstRow.done) return;

        state.rows.remove(new Set([firstRow.value.id]));
    };

    return <div>
        <div>
            <label htmlFor="headerPath">Header path</label>
            <input id="headerPath" ref={headerPathInputRef} />
            <button onClick={() => state.headers.remove(parseColumnPathInput(headerPathInputRef.current?.value))}>
                Remove header
            </button>
        </div>
        <div>
            <label htmlFor="columnPath">Column path</label>
            <input id="columnPath" ref={columnPathInputRef} />
            <button onClick={() => state.headers.add(
                parseColumnPathInput(columnPathInputRef.current?.value),
                parseColumnPathInput(headerPathInputRef.current?.value)
            )}>
                Add header
            </button>
        </div>

        <div>
            <label htmlFor="pageSize">Page size</label>
            <input id="pageSize" type="number" ref={pageSizeInputRef} />
            <button onClick={() => {
                const value = pageSizeInputRef.current?.value;
                state.page.setSize(value ? parseInt(value) : Infinity);
            }}>Set
            </button>
        </div>

        <div>
            <label htmlFor="pageIndex">Page index</label>
            <input id="pageIndex" type="number" ref={pageIndexInputRef} />
            <button onClick={() => {
                const value = pageIndexInputRef.current?.value;
                state.rows.setPageIndex(value ? parseInt(value) : 0);
            }}>Set
            </button>
        </div>

        <div>
            <button onClick={addLesson}>
                Add row
            </button>
            <button onClick={removeFirst}>
                Remove first row
            </button>
            <button onClick={() => state.history.undo()}>
                Undo
            </button>
            <button onClick={() => state.history.redo()}>
                Redo
            </button>
        </div>

        <Table state={state} headerNoWrap={true} />
    </div>;
}

export default App;
