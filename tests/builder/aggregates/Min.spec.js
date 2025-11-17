import {describe, expect, test} from "vitest";
import {Query} from "../../../src/index.js";
import {MissingRequiredArgument} from "../../../src/errors/QueryBuilder/Errors.js";
import {Min} from "../../../src/builder/aggregates/Min.js";

describe("Aggregates: Min", () => {
   test("It builds aggregate query without specified column", () => {
       const query = Query.from('users').where('id', '>', 5);
       expect(() => new Min(query).prepare()).toThrow(MissingRequiredArgument);
   });

    test("It builds aggregate query without specified column", () => {
        const query = Query.from('users').where('id', '>', 5);

        const countQueryResult = new Min(query, 'purchases').prepare();
        const expectedQuery = "SELECT MIN(temp_table.`purchases`) AS aggregate FROM (SELECT * FROM `users` WHERE `id` > ?) AS temp_table";
        const expectedBindings = [5];

        expect(countQueryResult.query).toEqual(expectedQuery);
        expect(countQueryResult.bindings).toEqual(expectedBindings);
    });
});