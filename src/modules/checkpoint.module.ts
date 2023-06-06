import {DynamicModule, Module} from "@nestjs/common";
import {getModelToken, MongooseModule} from "@nestjs/mongoose";
import {Model} from "mongoose";
import {OUTBOX_CHECKPOINT_MONGODB_URI} from "../constants";
import {CheckpointDocument, CheckpointEntity, CheckpointSchema} from "../checkpoint/impl/mongo/checkpointEntity";
import {MongoCheckpointRepository} from "../checkpoint/impl/mongo/mongoCheckpointRepository";

const CONNECTION_NAME = "checkpointConnection"

@Module({})
export class CheckpointModule {

    static register(enable: boolean): DynamicModule {
        return {
            module: CheckpointModule,
            imports: enable ? [
                MongooseModule.forRoot(OUTBOX_CHECKPOINT_MONGODB_URI, {
                    connectionName: CONNECTION_NAME,
                    directConnection: true,
                    autoCreate: true
                }),
                MongooseModule.forFeature([{name: CheckpointEntity.name, schema: CheckpointSchema}], CONNECTION_NAME),
            ] : [],
            providers: [
                enable ? {
                    provide: 'CheckpointRepository',
                    useFactory: (model: Model<CheckpointDocument>) => new MongoCheckpointRepository(model),
                    inject: [getModelToken(CheckpointEntity.name, CONNECTION_NAME)]
                } : {
                    provide: 'CheckpointRepository',
                    useValue: undefined
                }
            ],
            exports: ['CheckpointRepository']
        }
    }

}