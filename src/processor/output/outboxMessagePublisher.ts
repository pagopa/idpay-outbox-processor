import {OutboxMessage} from "../consumer/outboxConsumer";

export type OutboxMessagePublisher = (message: OutboxMessage) => Promise<any>;