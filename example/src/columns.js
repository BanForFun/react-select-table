import React from 'react';

// const columns = [
//     {
//         title: "#",
//         path: "id",
//         isHeader: true
//     },
//     {
//         title: "Title",
//         path: "title"
//     },
//     {
//         title: "Completed",
//         path: "completed",
//         render: renderCheckOrX
//     },
//     {
//         title: "E",
//         path: "e"
//     }
// ];
//
// function renderCheckOrX(bool) {
//     return bool ?
//         <i className="fa fa-check text-success" /> :
//         <i className="fa fa-times text-danger" />;
// }

const columns = [
    {
        title: "#",
        path: "id",
        isHeader: true
    },
    {
        title: "Post id",
        path: "postId"
    },
    {
        title: "Name",
        path: "name"
    },
    {
        title: "Email",
        path: "email"
    },
]

export default columns;
