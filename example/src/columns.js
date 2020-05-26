import React from 'react';

const columns = [
    {
        title: "#",
        path: "id",
        isHeader: true
    },
    {
        title: "Title",
        path: "title"
    },
    {
        title: "Completed",
        path: "completed",
        render: renderCheckOrX
    }
];

function renderCheckOrX(bool) {
    return bool ?
        <i className="fa fa-check text-success" /> :
        <i className="fa fa-times text-danger" />;
}

export default columns;