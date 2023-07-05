import { Publisher } from "../publisher/publisher";
import { SourceConnector } from "../source/sourceConnector";
import { PipelineJob } from "./pipelineJob";
import { createFullDocumentPipeline } from "./fullDocumentPipeline";

export interface PipelineConfig {
    name: string
    type: "full"
}

export namespace PipelineFactory {
    export async function fromConfig(config: PipelineConfig, source: SourceConnector, publisher: Publisher): Promise<PipelineJob> {
        switch (config.type) {
            case "full":
                return createFullDocumentPipeline(config.name, source, publisher);
            default:
                return Promise.reject("Unknown pipeline type: " + config.type);
        }
    }
}