import { ClientKafka } from "@nestjs/microservices";
import { Logger } from "@nestjs/common";
import { lastValueFrom } from "rxjs";
import { OutboxMessage } from "../../source/sourceConnector";
import { Publisher } from "../publisher";


export class KafkaMiddlewarePublisher implements Publisher {

    constructor(
        private readonly kafka: ClientKafka,
        private readonly topic: string
    ) { }

    send(message: OutboxMessage): Promise<OutboxMessage> {
        Logger.log(`Send evento to kafka for document ${JSON.stringify(message.key)}`);
        return lastValueFrom(this.kafka.emit(this.topic, {
            value: JSON.stringify(message.value),
            key: JSON.stringify(message.key)
        })).then(_ => message);
    }
}