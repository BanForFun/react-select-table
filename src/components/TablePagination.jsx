import React from 'react';
import classNames from "classnames";
import _ from "lodash";
import AngleDownIcon from "./AngleDownIcon";

import styles from "../index.scss";
import usePagination from "../hooks/usePagination";

function TablePagination({ ns }) {
    const {
        pageCount, pageIndex,
        isFirst, isLast,
        goToPage, nextPage, previousPage
    } = usePagination(ns);

    if (!pageCount) return null;

    const prevClass = classNames({
        "page-item": true,
        "disabled": isFirst
    });

    const nextClass = classNames({
        "page-item": true,
        "disabled": isLast
    });

    return <nav className={styles.pagination} aria-label="Pagination">
        <ul className="pagination">
            <li className={prevClass}>
                <button
                    className="page-link"
                    aria-label="Previous"
                    onClick={() => previousPage()}
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
                    return <li className={itemClass} key={i}>
                        <button
                            className="page-link"
                            onClick={() => goToPage(i)}
                        >{i + 1}</button>
                    </li>
                })
            }
            <li className={nextClass}>
                <button
                    className="page-link"
                    aria-label="Next"
                    onClick={() => nextPage()}
                >
                    <AngleDownIcon className={styles.nextPage} />
                </button>
            </li>
        </ul>
    </nav>
}

export default TablePagination;
