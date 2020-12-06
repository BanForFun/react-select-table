import React from 'react';
import classNames from "classnames";
import _ from "lodash";
import AngleDownIcon from "./AngleDownIcon";

import styles from "../index.scss";

function TablePagination({ pageIndex, pageCount, dispatchers }) {
    if (!pageCount) return null;

    const prevClass = classNames({
        "page-item": true,
        "disabled": pageIndex === 0
    });

    const nextClass = classNames({
        "page-item": true,
        "disabled": pageIndex === pageCount - 1
    });

    return <nav aria-label="Pagination">
        <ul className="pagination pagination-sm">
            <li className={prevClass}>
                <button
                    className="page-link"
                    aria-label="Previous"
                    onClick={() => dispatchers.previousPage()}
                >
                    <AngleDownIcon className={styles.prevPage} />
                </button>
            </li>
            {
                _.range(pageCount).map(i => {
                    const itemClass = classNames({
                        "page-item": true,
                        "active": pageIndex === i
                    });
                    return <li className={itemClass}>
                        <button
                            className="page-link"
                            onClick={() => dispatchers.goToPage(i)}
                        >{i + 1}</button>
                    </li>
                })
            }
            <li className={nextClass}>
                <button
                    className="page-link"
                    aria-label="Next"
                    onClick={() => dispatchers.nextPage()}
                >
                    <AngleDownIcon className={styles.nextPage} />
                </button>
            </li>
        </ul>
    </nav>
}

export default TablePagination;
