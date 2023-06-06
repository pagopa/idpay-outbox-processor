import { Logger } from "@nestjs/common";
import { Publisher } from "../publisher/publisher";
import { SourceConnector } from "../source/sourceConnector";
import { PipelineJob } from "./pipelineJob";
import { MongoNestedOutboxPublisher } from "./impl/mongoNestedOutbox";
import { MongoSourceCdcConnector } from "../source/mongo-cdc/mongoSourceCdcConnector";
import { MongoSourcePollConnector } from "../source/mongo-poll/mongoSourcePollConnector";
import { MongoExtractFullDocument } from "./impl/mongoExtractFullDocument";

export interface PipelineConfig {
    type: "nested-outbox" | "full"
}

export namespace PipelineFactory {
    export async function fromConfig(config: PipelineConfig, source: SourceConnector, publisher: Publisher): Promise<PipelineJob> {
        switch (config.type) {
            case "nested-outbox": 
                return new NestedOutboxPipelineFactory().fromConfig(config, source, publisher);
            case "full":
                return new FullDocumentPipelineFactory().fromConfig(config, source, publisher);
            default:
                return Promise.reject("Unknown pipeline type: " + config.type);
        }
    }
}

class NestedOutboxPipelineFactory {
    fromConfig(config: PipelineConfig, source: SourceConnector, publisher: Publisher): PipelineJob {
        const logger = new Logger("PipelineJob-" + config.type);
        if (source instanceof MongoSourceCdcConnector || source instanceof MongoSourcePollConnector) {
            return new PipelineJob(
                source,
                new MongoNestedOutboxPublisher(publisher, source.collection),
                [new MongoExtractFullDocument()],
                logger
            );
        } else {
            throw new Error("NestedOutboxPipeline is available only on mongo source");
        }
    }
}

class FullDocumentPipelineFactory {
    fromConfig(config: PipelineConfig, source: SourceConnector, publisher: Publisher): PipelineJob {
        const logger = new Logger("PipelineJob-" + config.type);
        return new PipelineJob(
            source,
            publisher,
            [new MongoExtractFullDocument()],
            logger
        );
    }
}