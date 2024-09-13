import { createState, withContext, simpleColumn, Table, Column } from 'react-select-table';
import 'react-select-table/index.css';
import './App.css';
import { useEffect, useRef } from 'react';

type Duration = [string, string] | undefined;

interface Lesson {
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
        getRowKey: l => l.name
    },
    columns: [
        withContext(l => l.name, simpleColumn('Name', { isHeader: true })),
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

state.pageSize.set(20);

for (let i = 0; i < state.columns.config.length; i++)
    state.headers.add([i], []);

// state.headers.add([3], [1, 1]);
// state.headers.add([3], [1, 1]);
// state.headers.add([1, 3], [1]);

state.rows.add([
    {
        name: 'Katevenis',
        monday: ['13:00', '15:00'],
        wednesday: ['13:00', '15:00'],
        friday: ['13:00', '15:00']
    },
    {
        name: 'Markatos',
        tuesday: ['14:00', '16:00'],
        thursday: ['14:00', '16:00']
    }
]);

for (let i = 0; i < 100; i++) {
    state.rows.add([{ name: 'Lesson ' + i }]);
}

state.history.clear();


function parseColumnPathInput(input?: string) {
    if (!input) return [];
    return input.split(' ').map(c => parseInt(c));
}


function App() {
    const columnPathInputRef = useRef<HTMLInputElement>(null);
    const headerPathInputRef = useRef<HTMLInputElement>(null);
    const pageSizeInputRef = useRef<HTMLInputElement>(null);
    const pageIndexInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => state.visibleRows.pageIndexChanged.addObserver(() => {
        if (pageIndexInputRef.current)
            pageIndexInputRef.current.value = state.visibleRows.pageIndex.toString();
    }), []);

    useEffect(() => state.pageSize.changed.addObserver(() => {
        if (pageSizeInputRef.current)
            pageSizeInputRef.current.value = state.pageSize.value.toString();
    }), []);

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
                state.pageSize.set(value ? parseInt(value) : Infinity);
            }}>Set
            </button>
        </div>

        <div>
            <label htmlFor="pageIndex">Page index</label>
            <input id="pageIndex" type="number" ref={pageIndexInputRef} />
            <button onClick={() => {
                const value = pageIndexInputRef.current?.value;
                state.visibleRows.setPageIndex(value ? parseInt(value) : 0);
            }}>Set
            </button>
        </div>

        <div>
            <button onClick={() => state.rows.add([{ name: 'Lesson' + Date.now() }])}>
                Add row
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
