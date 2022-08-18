// noinspection JSUnusedLocalSymbols
/**
 * @type {import('redux').Middleware<>}
 * @deprecated Has no purpose since v5.3.0
 */
const eventMiddleware = store => next => action => next(action)

export default eventMiddleware
