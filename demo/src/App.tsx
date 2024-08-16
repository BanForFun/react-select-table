import { createState, withContext, Table, Column } from 'react-select-table';
import './App.css';
import { useRef } from 'react';

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
        { header: 'Name', render: l => l.name },
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

state.scheduler.batch(() => {
    for (let i = 0; i < state.columns.config.length; i++) {
        state.headers.add([i], []);
    }

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
});


function parseColumnPathInput(input?: string) {
    if (!input) return [];
    return input.split(' ').map(c => parseInt(c));
}


function App() {
    const columnPathInputRef = useRef<HTMLInputElement>(null);
    const headerPathInputRef = useRef<HTMLInputElement>(null);

    return <div>
        <div>
            <label htmlFor="columnPath">Column path</label>
            <input id="columnPath" ref={columnPathInputRef} />
        </div>

        <div>
            <label htmlFor="visibleColumnPath">Header path</label>
            <input id="visibleColumnPath" ref={headerPathInputRef} />
        </div>

        <button onClick={() => state.headers.add(
            parseColumnPathInput(columnPathInputRef.current?.value),
            parseColumnPathInput(headerPathInputRef.current?.value)
        )}>
            Add column
        </button>

        <button onClick={() => state.headers.remove(parseColumnPathInput(headerPathInputRef.current?.value))}>
            Remove column
        </button>

        <button onClick={() => state.rows.add([{ name: 'Lesson' + Date.now() }])}>
            Add row
        </button>

        <button onClick={() => state.history.undo()}>
            Undo
        </button>

        <button onClick={() => state.history.redo()}>
            Redo
        </button>

        <Table state={state} />
    </div>;
}

export default App;
