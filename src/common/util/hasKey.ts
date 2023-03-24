// `keyof any` is short for "string | number | symbol"
// since an object key can be any of those types, our key can too
// in TS 3.0+, putting just "string" raises an error
export function hasKey<O extends Record<string, unknown>>(obj: O, key: string): boolean {
    return key in obj
}
