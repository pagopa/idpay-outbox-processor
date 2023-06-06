import { ClientKafka } from "@nestjs/microservices";
import { OutboxMessagePublisher } from "../outboxMessagePublisher";
import { Logger } from "@nestjs/common";
import { lastValueFrom } from "rxjs";
import { OutboxMessage } from "../../consumer/outboxConsumer";


export class KafkaOutboxMessagePublisher {
    
    constructor(
        private readonly kafka: ClientKafka,
        private readonly topic: string
    ) {}

    publisher(): OutboxMessagePublisher {
        return (message: OutboxMessage) => {
            const fullDocument = (message?.message as any)?.fullDocument;
            if (fullDocument) {
                Logger.log("Send evento to kafka");
                return lastValueFrom(this.kafka.emit(this.topic, fullDocument));
            } else {
                Logger.warn("Message to publish is not a fullDocument, it will not send");
                return Promise.resolve();
            }
        }
    }
}