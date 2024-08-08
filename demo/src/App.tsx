import { createController, withContext, Table, Column } from 'react-select-table';
import './App.css';
import { useRef } from 'react';

type Duration = {
    startHour: number;
    endHour: number;
} | null;

interface Lesson {
    name: string;
    lectures: Duration[];
}

function renderDuration(duration: Duration) {
    if (!duration) return null;
    return `${duration.startHour}:00 - ${duration.endHour}:00`;
}

function compareStart(a: Duration, b: Duration) {
    if (a === b) return 0;
    if (!a) return 1;
    if (!b) return -1;

    return a.startHour - b.startHour;
}

function lessonColumn(header: string): Column<Duration> {
    return {
        header,
        render: renderDuration,
        compareContext: compareStart
    };
}

const controller = createController<Lesson>({
    getRowKey: row => row.name,
    columns: [
        { header: 'Name', render: row => row.name },
        {
            header: 'Weekdays', children: [
                withContext(row => row.lectures[0], lessonColumn('Monday')),
                withContext(row => row.lectures[1], lessonColumn('Tuesday')),
                withContext(row => row.lectures[2], lessonColumn('Wednesday')),
                withContext(row => row.lectures[3], lessonColumn('Thursday')),
                withContext(row => row.lectures[4], lessonColumn('Friday'))
            ]
        },
        {
            header: 'Weekend', children: [
                withContext(row => row.lectures[5], lessonColumn('Saturday')),
                withContext(row => row.lectures[6], lessonColumn('Sunday'))
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

for (let i = 0; i < controller.config.columns.length; i++) {
    controller.actions.addColumn([i], [i]);
}

function parseColumnPathInput(input?: string) {
    if (!input) return [];
    return input.split(' ').map(c => parseInt(c));
}


function App() {
    const columnPathInputRef = useRef<HTMLInputElement>(null);
    const visibleColumnPathInputRef = useRef<HTMLInputElement>(null);

    return <div>
        <div>
            <label htmlFor="columnPath">Column path</label>
            <input id="columnPath" ref={columnPathInputRef} />
        </div>

        <div>
            <label htmlFor="visibleColumnPath">Visible column path</label>
            <input id="visibleColumnPath" ref={visibleColumnPathInputRef} />
        </div>

        <button onClick={() => {
            controller.actions.addColumn(
                parseColumnPathInput(columnPathInputRef.current?.value),
                parseColumnPathInput(visibleColumnPathInputRef.current?.value)
            );

            console.log(controller.state.columns);
        }}>
            Add
        </button>

        <Table controller={controller} />
    </div>;
}

export default App;
