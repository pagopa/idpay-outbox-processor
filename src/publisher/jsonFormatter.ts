import { EJSON } from "bson";
import { mongo } from "mongoose";

export type DocumentFormatter = typeof relaxedFormatter | typeof simplifiedFormatter

export const relaxedFormatter = function(document: mongo.BSON.Document) {
    return EJSON.stringify(document, {relaxed: true, useBigInt64: true});
}

export const simplifiedFormatter = function(document: mongo.BSON.Document) {
    return EJSON.stringify(document, simplifyRelaxedDocument, undefined, { relaxed: true, useBigInt64: true });
}

function simplifyRelaxedDocument(key: string, value: any) {
    if (typeof(value) == "object") {
        if (value["$numberDecimal"]) {
            return value["$numberDecimal"].toString();
        } else if (value["$oid"]) {
            return value["$oid"].toString();
        }
    }
    return value;
}