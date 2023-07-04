import { ClientKafka } from "@nestjs/microservices";
import { Logger } from "@nestjs/common";
import { lastValueFrom } from "rxjs";
import { OutboxMessage } from "../../source/sourceConnector";
import { Publisher } from "../publisher";


/**
 * A kafka publisher which implements pipeline publisher interface.
 */
export class KafkaPublisher implements Publisher {

    constructor(
        private readonly kafka: ClientKafka,
        private readonly topic: string,
        private readonly logger: Logger = new Logger(KafkaPublisher.name),
    ) { }

    send(message: OutboxMessage): Promise<OutboxMessage> {
        this.logger.log(`Send evento to kafka for document ${JSON.stringify(message.key)}`);
        return lastValueFrom(this.kafka.emit(this.topic, {
            value: JSON.stringify(message.value),
            key: JSON.stringify(message.key)
        })).then(_ => message);
    }
}