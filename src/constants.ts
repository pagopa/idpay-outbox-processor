import * as process from "process";

export const ENVIRONMENT = process.env.NODE_ENV || 'development';

/**
 * Change feed configuration:
 * - mongodb connection uri
 * - collection to observe
 * - optional: mongodb uri where to save checkpoint to resume stream after outage.
 */
export const MONGO_DB_URI = process.env.MONGO_DB_URI || "mongodb://localhost:27017";
export const OUTBOX_COLLECTION_NAME = process.env.OUTBOX_COLLECTION_NAME || "example";
export const OUTBOX_CHECKPOINT_MONGODB_URI = process.env.OUTBOX_CHECKPOINT_MONGODB_URI || ""

/**
 * Kakfa settings:
 * - broker where publish messages
 * - topic used to publish messages
 * - connection string jaas: is not same used in java, but it's the azure eventhub provided connection stirng
 */
export const OUTBOX_KAFKA_BROKER = process.env.OUTBOX_KAFKA_BROKER || "localhost:29095";
export const OUTBOX_KAFKA_TOPIC = process.env.OUTBOX_KAFKA_TOPIC || "events";
export const OUTBOX_KAFKA_SASL_JAAS = process.env.OUTBOX_KAFKA_SASL_JAAS || "";