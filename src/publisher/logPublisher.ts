import { Logger } from "@nestjs/common";
import { OutboxMessage } from "../source/sourceConnector";
import { Publisher } from "./publisher";


export class LogPublisher implements Publisher {

    constructor(
        private readonly logger: Logger = new Logger("FakePublisher")
    ) { }

    send(message: OutboxMessage): Promise<OutboxMessage> {
        this.logger.log("Fake publish event: " + JSON.stringify(message));
        return Promise.resolve(message);
    }
}
