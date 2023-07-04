import { OutboxMessage } from "../source/sourceConnector"

/**
 * PipelineStage represent a single stage step to transform message.
 */
export type PipelineStage = PipelineStageProcessor | ((message: OutboxMessage) => Promise<OutboxMessage>)
export interface PipelineStageProcessor {
    apply(message: OutboxMessage): Promise<OutboxMessage>
}