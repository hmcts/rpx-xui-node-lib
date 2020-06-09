// `keyof any` is short for "string | number | symbol"
// since an object key can be any of those types, our key can too
// in TS 3.0+, putting just "string" raises an error
export function hasKey<O>(obj: O, key: keyof any): key is keyof O {
    return key in obj
}
