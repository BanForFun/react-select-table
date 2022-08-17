// noinspection JSUnusedLocalSymbols

/**
 * @type {import('redux').Middleware<>}
 * @deprecated Has no purpose since v5.2.6. Its functionality was integrated into the reducer.
 */
const eventMiddleware = store => next => action => next(action)

export default eventMiddleware
