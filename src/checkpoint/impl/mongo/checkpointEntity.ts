import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {HydratedDocument} from "mongoose";

@Schema({ timestamps: true })
export class CheckpointEntity {

    @Prop({ required: true, index: true })
    key!: String

    @Prop({ required: true })
    value!: String
}

export type CheckpointDocument = HydratedDocument<CheckpointEntity>;
export const CheckpointSchema = SchemaFactory.createForClass(CheckpointEntity);