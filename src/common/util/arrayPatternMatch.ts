import { isStringPatternMatch } from './stringPatternMatch'

/**
 * Array pattern match
 *
 * Checks an array of strings for pattern matches.
 *
 * @param array
 * @param pattern - regex pattern
 */

export const arrayPatternMatch = (array: string[], pattern: string): boolean => {
    return array.filter((arrayValue: string) => isStringPatternMatch(arrayValue, pattern)).length > 0
}
