import { OutboxMessage } from "../source/sourceConnector"

export type Middleware = MiddlewareProcessor | ((message: OutboxMessage) => Promise<OutboxMessage>)
export interface MiddlewareProcessor {
    apply(message: OutboxMessage): Promise<OutboxMessage>
}