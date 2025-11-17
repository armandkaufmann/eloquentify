import {describe, expect, test} from "vitest";
import {Query} from "../../../src/index.js";
import {Sum} from "../../../src/builder/aggregates/Sum.js";
import {MissingRequiredArgument} from "../../../src/errors/QueryBuilder/Errors.js";

describe("Aggregates: Sum", () => {
   test("It builds aggregate query without specified column", () => {
       const query = Query.from('users').where('id', '>', 5);
       expect(() => new Sum(query).prepare()).toThrow(MissingRequiredArgument);
   });

    test("It builds aggregate query without specified column", () => {
        const query = Query.from('users').where('id', '>', 5);

        const countQueryResult = new Sum(query, 'purchases').prepare();
        const expectedQuery = "SELECT SUM(temp_table.`purchases`) AS aggregate FROM (SELECT * FROM `users` WHERE `id` > ?) AS temp_table";
        const expectedBindings = [5];

        expect(countQueryResult.query).toEqual(expectedQuery);
        expect(countQueryResult.bindings).toEqual(expectedBindings);
    });
});