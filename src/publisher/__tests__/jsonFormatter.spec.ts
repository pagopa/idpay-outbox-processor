import { Decimal128, ObjectId } from "bson"
import { relaxedFormatter, simplifiedFormatter } from "../jsonFormatter"


describe("JSON formatter", () => {

    const exampleBsonDocumentWithExtended = {
        _id: new ObjectId("64956e2c409d5fa75a452c5e"),
        name: 'John Doe',
        age: 10,
        email: 'john.doe88@example.com',
        events: [{ id: 'first', data: [10, 2, { value: 12.3 }] }],
        version: 1,
        amount: 12.45657678934,
        someDecimal128: new Decimal128("1235.432534543243535")
    }

    const exampleBsonDocument = {
        _id: new ObjectId("64956e2c409d5fa75a452c5e"),
        name: 'John Doe',
        age: 10,
        email: 'john.doe88@example.com',
        events: [{ id: 'first', data: [10, 2, { value: 12.3 }] }],
        version: 1
    }

    describe("relaxed", () => {
        it("must format extended document to proper relaxed json", () => {
            expect(relaxedFormatter(exampleBsonDocumentWithExtended)).toBe(
                '{"_id":{"$oid":"64956e2c409d5fa75a452c5e"},"name":"John Doe","age":10,"email":"john.doe88@example.com","events":[{"id":"first","data":[10,2,{"value":12.3}]}],"version":1,"amount":12.45657678934,"someDecimal128":{"$numberDecimal":"1235.432534543243535"}}'
            )
        })

        it("must format a document to proper relaxed json", () => {
            expect(relaxedFormatter(exampleBsonDocument)).toBe(
                '{"_id":{"$oid":"64956e2c409d5fa75a452c5e"},"name":"John Doe","age":10,"email":"john.doe88@example.com","events":[{"id":"first","data":[10,2,{"value":12.3}]}],"version":1}'
            )
        })
    })


    describe("simplified", () => {
        it("must format extended document to simplifed json which simply numeric values", () => {
            expect(simplifiedFormatter(exampleBsonDocumentWithExtended)).toBe(
                '{"_id":"64956e2c409d5fa75a452c5e","name":"John Doe","age":10,"email":"john.doe88@example.com","events":[{"id":"first","data":[10,2,{"value":12.3}]}],"version":1,"amount":12.45657678934,"someDecimal128":"1235.432534543243535"}'
            )
        })

        it("must format a document to simplifed json which simply numeric values", () => {
            expect(simplifiedFormatter(exampleBsonDocument)).toBe(
                '{"_id":"64956e2c409d5fa75a452c5e","name":"John Doe","age":10,"email":"john.doe88@example.com","events":[{"id":"first","data":[10,2,{"value":12.3}]}],"version":1}'
            )
        })
    })

})