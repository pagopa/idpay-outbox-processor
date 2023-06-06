import { OutboxMessage } from "../source/sourceConnector";


export interface Publisher {
    send(message: OutboxMessage): Promise<OutboxMessage>
}