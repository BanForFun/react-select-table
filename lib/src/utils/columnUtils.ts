import React from 'react';
import { Primitive } from './types';
import { comparePrimitives } from './sortUtils';

export interface ColumnOptions {
    className?: string;
}

interface BaseColumn {
    header: React.ReactNode;
}

export interface ColumnGroup<TContext> extends BaseColumn {
    children: Column<TContext>[];
}

export interface LeafColumn<TContext> extends BaseColumn {
    render: (context: TContext, options: ColumnOptions) => React.ReactNode;
    isHeader?: boolean;
    compareContext?: (a: TContext, b: TContext) => number;
    // isContextEqual?: (a: TContext, b: TContext) => boolean;
    children?: never;
}

// Public
export type Column<TContext> = ColumnGroup<TContext> | LeafColumn<TContext>

export function isColumnGroup<TContext>(column: Column<TContext>): column is ColumnGroup<TContext> {
    return !!column.children;
}

interface SimpleColumnOptions {
    allowSorting?: boolean;
    isHeader?: boolean;
}

// Public
export function simpleColumn(header: React.ReactNode, options: SimpleColumnOptions = {}): LeafColumn<Primitive> {
    return {
        header,
        isHeader: options.isHeader,
        compareContext: options.allowSorting ? comparePrimitives : undefined,
        // isContextEqual: (a, b) => a === b,
        render: (context) => context
    };
}

// Public
export function withContext<TParentContext, TContext>(
    getContext: (context: TParentContext) => TContext,
    column: Column<TContext>
): Column<TParentContext> {
    if (!column.children) {
        const { compareContext, render } = column;

        return {
            ...column,
            // isContextEqual: isContextEqual
            //     ? (a: TParentContext, b: TParentContext) => isContextEqual(getContext(a), getContext(b))
            //     : isContextEqual,
            compareContext: compareContext
                ? (a: TParentContext, b: TParentContext) => compareContext(getContext(a), getContext(b))
                : compareContext,
            render: (context: TParentContext, ...rest) => render(getContext(context), ...rest)
        };
    }

    const { children } = column;
    return {
        ...column,
        children: children.map(c => withContext(getContext, c))
    };
}