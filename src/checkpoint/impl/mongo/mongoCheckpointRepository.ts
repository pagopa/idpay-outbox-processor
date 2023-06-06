import {Checkpoint, CheckpointRepository} from "../../checkpoint";
import {Model} from "mongoose";
import {CheckpointDocument} from "./checkpointEntity";

export class MongoCheckpointRepository implements CheckpointRepository {

    constructor(
        private model: Model<CheckpointDocument>
    ) {
    }

    findByKey(key: String): Promise<Checkpoint | undefined> {
        return this.model.findOne({key: key})
            .then(document => {
                if (document) {
                    return Promise.resolve(new Checkpoint(document.key, document.value));
                }
                return Promise.resolve(undefined);
            }).catch(_ => Promise.resolve(undefined));
    }

    save(checkpoint: Checkpoint): Promise<Checkpoint> {
        return this.model.findOneAndUpdate(
            {key: checkpoint.key},
            {key: checkpoint.key, value: checkpoint.value},
            {upsert: true, new: true}
        ).then(_ => checkpoint);
    }
}