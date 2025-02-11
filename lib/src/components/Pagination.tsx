import React, { useCallback } from 'react';
import AngleIcon, { Rotation } from './AngleIcon';
import { TableData } from '../utils/configUtils';
import useRequiredContext from '../hooks/useRequiredContext';
import getTableContext from '../context/tableContext';
import useUpdateWhen from '../hooks/useUpdateWhen';
import { windowEventManager } from '../utils/eventUtils';

enum Step {
    Next = 1,
    Previous = -1
}

const startDelay = 600;
const repeatDelay = 100;
const width = 4;

const pageProps = {
    className: 'rst-page'
};

const pageButtonProps = {
    ...pageProps,
    tabIndex: -1
};

export default function Pagination<TData extends TableData>() {
    const { state } = useRequiredContext(getTableContext<TData>());

    useUpdateWhen(state.rows.pageIndexChanged);
    useUpdateWhen(state.rows.pageCountChanged);

    const { pageIndex } = state.rows;
    const pageCount = state.rows.calculatePageCount();

    const getStepButtonPointerDownHandler = useCallback((step: Step) => {
        let timeoutId: number | null = null;

        const repeatAction = (delay = repeatDelay) => {
            const pageIndex = state.rows.pageIndex + step;
            if (pageIndex < 0 || pageIndex >= state.rows.calculatePageCount()) return;

            state.rows.setPageIndex(pageIndex);

            timeoutId = setTimeout(repeatAction, delay);
        };

        return (e: React.PointerEvent) => {
            const { pointerId } = e;

            const eventGroup = windowEventManager.createGroup();
            repeatAction(startDelay);

            const handlePointerLost = (e: PointerEvent) => {
                if (e.pointerId !== pointerId) return;

                if (timeoutId != null)
                    clearTimeout(timeoutId);

                timeoutId = null;
                eventGroup.removeAllListeners();
            };

            eventGroup.addListener(window, 'pointerup', handlePointerLost);
            eventGroup.addListener(window, 'pointercancel', handlePointerLost);
        };
    }, [state]);

    if (!isFinite(state.page.size)) return null;

    const PageButton = ({ index }: { index: number }) =>
        <button {...pageButtonProps}
                onClick={() => state.rows.setPageIndex(index)}
                data-is-current={index === pageIndex}
        >{index + 1}</button>;

    const PageStepButton = (props: { children: React.ReactNode, step: Step }) =>
        <button {...pageButtonProps}
                onPointerDown={getStepButtonPointerDownHandler(props.step)}
        ><span className="rst-inlineIcons rst-lineHeight">{props.children}</span></button>;

    const pages = [];

    const pageFromStart = Math.min(pageIndex + 1, width);
    const pageFromEnd = Math.min(pageCount - pageIndex, width);

    if (pageFromStart >= 3)
        pages.push(<PageButton key="page_first" index={0} />);

    if (pageFromStart >= 4)
        pages.push(<div key="ellipsis_left" {...pageProps}>...</div>);

    if (pageFromStart >= 2)
        pages.push(<PageStepButton key="button_prev" step={Step.Previous}>
            <AngleIcon rotation={Rotation.Left} />
        </PageStepButton>);

    pages.push(<PageButton key="page_current" index={pageIndex} />);

    if (pageFromEnd >= 2)
        pages.push(<PageStepButton key="button_next" step={Step.Next}>
            <AngleIcon rotation={Rotation.Right} />
        </PageStepButton>);

    if (pageFromEnd >= 4)
        pages.push(<div key="ellipsis_right" {...pageProps}>...</div>);

    if (pageFromEnd >= 3)
        pages.push(<PageButton key="page_last" index={pageCount - 1} />);

    return <div className="rst-pagination">
        {Array.from({ length: width - pageFromStart }, (_, i) =>
            <div {...pageProps} key={`padding_left_${i}`} />)}
        {pages}
        {Array.from({ length: width - pageFromEnd }, (_, i) =>
            <div {...pageProps} key={`padding_right_${i}`} />)}
    </div>;
}