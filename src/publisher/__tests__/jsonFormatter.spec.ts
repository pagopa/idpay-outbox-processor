import { Decimal128, ObjectId } from "bson"
import { relaxedFormatter, simplifiedFormatter } from "../jsonFormatter"


describe("JSON formatter", () => {

    const exampleBsonDocument = {
        _id: new ObjectId("64956e2c409d5fa75a452c5e"),
        name: 'John Doe',
        age: 10,
        email: 'john.doe88@example.com',
        events: [{ id: 'first', data: [10, 2, { value: 12.3 }] }],
        version: 1,
        amount: 12.45657678934,
        someDecimal128: new Decimal128("1235.432534543243535")
    }

    describe("relaxed", () => {
        it("must format to proper relaxed json", () => {
            expect(relaxedFormatter(exampleBsonDocument)).toBe(
                '{"_id":{"$oid":"64956e2c409d5fa75a452c5e"},"name":"John Doe","age":10,"email":"john.doe88@example.com","events":[{"id":"first","data":[10,2,{"value":12.3}]}],"version":1,"amount":12.45657678934,"someDecimal128":{"$numberDecimal":"1235.432534543243535"}}'
            )
        })
    })


    describe("simplified", () => {
        it("must format to simplifed json which simply numeric values", () => {
            expect(simplifiedFormatter(exampleBsonDocument)).toBe(
                '{"_id":"64956e2c409d5fa75a452c5e","name":"John Doe","age":10,"email":"john.doe88@example.com","events":[{"id":"first","data":[10,2,{"value":12.3}]}],"version":1,"amount":12.45657678934,"someDecimal128":"1235.432534543243535"}'
            )
        })
    })

})