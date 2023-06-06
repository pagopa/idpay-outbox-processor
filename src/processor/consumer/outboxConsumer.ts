import {Checkpoint} from "../../checkpoint/checkpoint";

export class OutboxMessage {
    constructor(
        public readonly id: any,
        public readonly message: string,
        public readonly checkpoint: Checkpoint
    ) {}
}

export interface OutboxConsumer {
    next(): Promise<OutboxMessage>
    close(): Promise<void>
    commit(message: OutboxMessage): Promise<any>;
    seekTo(checkpoint: Checkpoint): Promise<any>;
}