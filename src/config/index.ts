import * as dotenv from "dotenv";
import * as z from "zod";

// load environment variables from .env file. 
// It's useful for local developing
dotenv.config();

const appConfigSchema = z.object({
    formatter: z.enum(["relaxed", "simplified"]).optional().default("relaxed"),
    mongoDbUri: z.string().nonempty(),
    mongoDbName: z.string().nonempty(),
    outboxCollectionName: z.string().nonempty(),
    checkpointConfig: z.object({
        checkpointMongoUri: z.string(),
        checkpointEvery: z.number().default(1),
    }).optional(),
    kafkaConfig: z.object({
        broker: z.string(),
        topic: z.string(),
        saslJaas: z.string().optional()
    }).optional(),
    logLevel: z.enum(['debug', 'log', 'warn', 'error']).optional().default('log')
});

export type AppConfig = z.infer<typeof appConfigSchema>;

export const appConfig: AppConfig = appConfigSchema.parse({
    formatter: process.env.FORMAT_TYPE,
    mongoDbUri: process.env.MONGO_DB_URI,
    mongoDbName: process.env.MONGO_DB_NAME ?? "rtd",
    outboxCollectionName: process.env.OUTBOX_COLLECTION_NAME,
    checkpointConfig: process.env.CHECKPOINT_MONGODB_URI ? {
        checkpointMongoUri: process.env.CHECKPOINT_MONGODB_URI,
        checkpointEvery: process.env.CHECKPOINT_EVERY
    } : undefined,
    kafkaConfig: process.env.OUTBOX_KAFKA_BROKER ? {
        broker: process.env.OUTBOX_KAFKA_BROKER,
        topic: process.env.OUTBOX_KAFKA_TOPIC,
        saslJass: process.env.OUTBOX_KAFKA_SASL_JAAS,
    } : undefined,
    logLevel: process.env.LOG_LEVEL
});