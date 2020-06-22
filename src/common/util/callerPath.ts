import CallSite = NodeJS.CallSite

export const callerPath = (): string => {
    const originalFunc = Error.prepareStackTrace

    let callerFile: string | null | undefined
    try {
        const err = new Error()

        Error.prepareStackTrace = (err: Error, stack: CallSite[]): CallSite[] => {
            return stack
        }

        const filters = ['callerPath', 'debug.logger', 'task_queues', 'passport', 'express']

        const stacks = ((err.stack as unknown) as CallSite[]).map((callSite: CallSite) => {
            const filename = callSite.getFileName()
            // console.log('FILENAME => ', filename)
            return filename?.split('dist/').pop()
        })

        const filteredStacks = new Set(
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            stacks.filter((filter: string) => {
                if (!filter) {
                    return false
                }
                return !filters.some((v) => filter.includes(v))
            }),
        )

        callerFile = [...filteredStacks].pop()
    } catch (e) {}

    Error.prepareStackTrace = originalFunc

    return callerFile as string
}
