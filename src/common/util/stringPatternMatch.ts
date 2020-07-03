/**
 * Is String Pattern Match
 *
 * Checks if a string matches a specified Regular Expression.
 *
 * @param string
 * @param pattern - regex pattern
 * @returns {boolean}
 */
export const isStringPatternMatch = (string: string, pattern: string): boolean => new RegExp(pattern).test(string)
