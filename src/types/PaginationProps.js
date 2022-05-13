import PropTypes from 'prop-types'

/**
 * Pagination component props
 * @typedef {PropTypes.InferProps<paginationProps>} PaginationProps
 */
const paginationProps = {
  /**
   * The page number the user is currently in (1 based)
   */
  page: PropTypes.number,
  /**
   * The total page count
   */
  pageCount: PropTypes.number,
  /**
   * Takes the user to another page
   * @function
   * @param {number} page The new page number
   */
  goToPage: PropTypes.func
}

export default paginationProps
