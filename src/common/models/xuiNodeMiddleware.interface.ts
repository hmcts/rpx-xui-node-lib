import { EventEmitter } from 'events'

export interface XuiNodeMiddlewareInterface extends EventEmitter {
    getEvents(): string[]
}
