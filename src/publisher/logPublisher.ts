import { Logger } from "@nestjs/common";
import { OutboxMessage } from "../source/sourceConnector";
import { Publisher } from "./publisher";
import { DocumentFormatter, simplifiedFormatter } from "./jsonFormatter";


export class LogPublisher implements Publisher {

    constructor(
        private readonly logger: Logger = new Logger("LogPublisher"),
        private readonly formatter: DocumentFormatter = simplifiedFormatter
    ) { }

    send(message: OutboxMessage): Promise<OutboxMessage> {
        const payload = this.formatter(message.value);
        this.logger.log(
            `Event to publish with key ${message.key}\npayload ${payload}`,
        )
        return Promise.resolve(message);
    }
}
