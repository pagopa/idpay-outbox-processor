import {Checkpoint, CheckpointRepository} from "../checkpoint";
import * as fs from "fs";

export class FileCheckpointRepository implements CheckpointRepository {

    constructor() {}

    findByKey(key: String): Promise<Checkpoint | undefined> {
        return new Promise((resolve, _) => {
            fs.readFile(`${key.trim()}.txt`, 'utf8', (err, data) => {
                if (!err) {
                    resolve(new Checkpoint(key, data.trim()));
                } else {
                    resolve(undefined);
                }
            })
        })
    }

    save(checkpoint: Checkpoint): Promise<Checkpoint> {
        return new Promise((resolve, reject) => {
            fs.writeFile(`${checkpoint.key.trim()}.txt`, checkpoint.value.toString(), () => {
                resolve(checkpoint);
            })
        })
    }
}