import { Publisher } from "../publisher/publisher";
import { OutboxMessage, SourceConnector } from "../source/sourceConnector";
import { PipelineJob } from "./pipelineJob";
import { PipelineStageProcessor } from "./pipelineStage";
import { Logger } from "@nestjs/common";

export function createFullDocumentPipeline(name: string, source: SourceConnector, publisher: Publisher): PipelineJob {
    const logger = new Logger(`FullDocumentPipeline-${name}`);
    return new PipelineJob(
        source,
        publisher,
        [new MongoExtractFullDocument()],
        logger
    );
}

class MongoExtractFullDocument implements PipelineStageProcessor {

    constructor(
        private readonly logger: Logger = new Logger(MongoExtractFullDocument.name)
    ) {}

    apply(message: OutboxMessage): Promise<OutboxMessage> {
        const fullDocument = (message?.value as any)?.fullDocument;
        if (fullDocument) {
            return Promise.resolve(new OutboxMessage(message.key, message.key, fullDocument, message.source));
        } else {
            this.logger.error("No valid fullDocument, skipping it", message.key);
            return Promise.resolve(message);
        }
    }
}