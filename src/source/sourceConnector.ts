import {SourceInfo} from "./mongo-cdc/sourceInfo";

export class OutboxMessage {
    constructor(
        public readonly rootKey: any,
        public readonly key: any,
        public readonly value: any,
        public readonly source?: SourceInfo
    ) {}
}

export interface SourceConnector {
    next(): Promise<OutboxMessage | undefined>
    close(): Promise<void>
    commit(message: OutboxMessage): Promise<any>;
}