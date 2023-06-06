import {SourceInfo, SourceInfoRepository} from "./sourceInfo";
import {HydratedDocument, Model} from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

export class MongoSourceInfoRepository implements SourceInfoRepository {

    constructor(
        private model: Model<SourceInfoDocument>
    ) {
    }

    findByKey(key: String): Promise<SourceInfo | undefined> {
        return this.model.findOne({collectionName: key})
            .then(document => {
                if (document) {
                    return Promise.resolve(new SourceInfo(document.collectionName, document.resumeToken));
                }
                return Promise.resolve(undefined);
            }).catch(_ => Promise.resolve(undefined));
    }

    save(checkpoint: SourceInfo): Promise<SourceInfo> {
        return this.model.findOneAndUpdate(
            {collectionName: checkpoint.collectionName},
            {key: checkpoint.collectionName, value: checkpoint.resumeToken},
            {upsert: true, new: true}
        ).then(_ => checkpoint);
    }
}

@Schema({ timestamps: true })
export class SourceInfoEntity {

    @Prop({ required: true, index: true })
    collectionName!: String

    @Prop({ required: true })
    resumeToken!: String
}

export type SourceInfoDocument = HydratedDocument<SourceInfoEntity>;
export const SourceInfoSchema = SchemaFactory.createForClass(SourceInfoEntity);