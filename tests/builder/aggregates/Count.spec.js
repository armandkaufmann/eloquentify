import {describe, expect, test} from "vitest";
import {Query} from "../../../src/index.js";
import {Count} from "../../../src/builder/aggregates/Count.js";

describe("Aggregates: Count", () => {
   test("It builds aggregate query without specified column", () => {
       const query = Query.from('users').where('id', '>', 5);

       const countQueryResult = new Count(query).prepare();
       const expectedQuery = "SELECT COUNT(*) AS aggregate FROM (SELECT * FROM `users` WHERE `id` > ?) AS temp_table";
       const expectedBindings = [5];

       expect(countQueryResult.query).toEqual(expectedQuery);
       expect(countQueryResult.bindings).toEqual(expectedBindings);
   });

    test("It builds aggregate query without specified column", () => {
        const query = Query.from('users').where('id', '>', 5);

        const countQueryResult = new Count(query, 'id').prepare();
        const expectedQuery = "SELECT COUNT(temp_table.`id`) AS aggregate FROM (SELECT * FROM `users` WHERE `id` > ?) AS temp_table";
        const expectedBindings = [5];

        expect(countQueryResult.query).toEqual(expectedQuery);
        expect(countQueryResult.bindings).toEqual(expectedBindings);
    });

    test("It supports raw queries", () => {
        const query = Query.from('users').where('id', '>', 5);
        const rawQuery = Query.raw("CASE WHEN active = 1 THEN 1 END");

        const countQueryResult = new Count(query, rawQuery).prepare();
        const expectedQuery = "SELECT COUNT(CASE WHEN active = 1 THEN 1 END) AS aggregate FROM (SELECT * FROM `users` WHERE `id` > ?) AS temp_table";
        const expectedBindings = [5];

        expect(countQueryResult.query).toEqual(expectedQuery);
        expect(countQueryResult.bindings).toEqual(expectedBindings);
    });
});