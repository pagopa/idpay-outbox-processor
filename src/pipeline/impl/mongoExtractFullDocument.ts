import { Logger } from "@nestjs/common";
import { OutboxMessage } from "../../source/sourceConnector";
import { MiddlewareProcessor } from "../middleware";


export class MongoExtractFullDocument implements MiddlewareProcessor {

    apply(message: OutboxMessage): Promise<OutboxMessage> {
        const fullDocument = (message?.value as any)?.fullDocument;
        if (fullDocument) {
            return Promise.resolve(new OutboxMessage(message.key, message.key, fullDocument, message.checkpoint));
        } else {
            Logger.error("No valid fullDocument, skipping it", message.key);
            return Promise.resolve(message);
        }
    }
}