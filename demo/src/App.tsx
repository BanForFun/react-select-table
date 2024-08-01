import { Controller, withContext, Table } from 'react-select-table';
import './App.css';
import { useRef } from 'react';

interface Duration {
    start: string;
    end: string;
}

interface Lesson {
    name: string;
    lectures: Duration[];
}

function renderDuration(duration: Duration) {
    return `${duration.start} - ${duration.end}`;
}

const controller = new Controller<Lesson, never>({
    getRowKey: row => row.name,
    columns: [
        { header: 'Name', render: row => row.name },
        {
            header: 'Weekdays', children: [
                withContext(row => row.lectures[0], {
                    header: 'Monday',
                    render: renderDuration
                }),
                withContext(row => row.lectures[1], {
                    header: 'Tuesday',
                    render: renderDuration
                }),
                withContext(row => row.lectures[2], {
                    header: 'Wednesday',
                    render: renderDuration
                }),
                withContext(row => row.lectures[3], {
                    header: 'Thursday',
                    render: renderDuration
                }),
                withContext(row => row.lectures[4], {
                    header: 'Friday',
                    render: renderDuration
                })
            ]
        },
        {
            header: 'Weekend', children: [
                withContext(row => row.lectures[5], {
                    header: 'Saturday',
                    render: renderDuration
                }),
                withContext(row => row.lectures[6], {
                    header: 'Sunday',
                    render: renderDuration
                })
            ]
        }
    ]
});

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

            // controller.actions.addColumn([0], [0]);
            // controller.actions.addColumn([0], [0]);

            console.log(controller.state.visibleColumns);
        }}>
            Add
        </button>

        <Table controller={controller} />
    </div>;
}

export default App;
