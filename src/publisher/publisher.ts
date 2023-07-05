import { Logger } from "@nestjs/common";
import { OutboxMessage } from "../source/sourceConnector";

/**
 * The publisher interface of a pipeline
 */
export interface Publisher {

    /**
     * Send a message
     * @param message message to publish
     */
    send(message: OutboxMessage): Promise<OutboxMessage>
}
