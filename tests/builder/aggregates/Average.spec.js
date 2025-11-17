import {describe, expect, test} from "vitest";
import {Query} from "../../../src/index.js";
import {MissingRequiredArgument} from "../../../src/errors/QueryBuilder/Errors.js";
import {Average} from "../../../src/builder/aggregates/Average.js";

describe("Aggregates: Average", () => {
   test("It builds aggregate query without specified column", () => {
       const query = Query.from('users').where('id', '>', 5);
       expect(() => new Average(query).prepare()).toThrow(MissingRequiredArgument);
   });

    test("It builds aggregate query without specified column", () => {
        const query = Query.from('users').where('id', '>', 5);

        const countQueryResult = new Average(query, 'purchases').prepare();
        const expectedQuery = "SELECT AVG(temp_table.`purchases`) AS aggregate FROM (SELECT * FROM `users` WHERE `id` > ?) AS temp_table";
        const expectedBindings = [5];

        expect(countQueryResult.query).toEqual(expectedQuery);
        expect(countQueryResult.bindings).toEqual(expectedBindings);
    });
});