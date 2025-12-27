import {describe, expect, beforeEach, test, vi} from 'vitest';
import {Exists} from "../../../../src/builder/statement/exists/Exists.js";
import {Query} from "../../../../src/index.js";

describe("Statement: Exists", () => {
    let existModule = null;
    let baseQuery = null;

    beforeEach(() => {
        baseQuery = Query.from('users').where('id', 10);
        existModule = new Exists(baseQuery);
    });

    test("It builds a prepared query object", () => {
       const expectedQuery = "SELECT EXISTS(SELECT * FROM `users` WHERE `id` = ?)";
       const expectedBindings = [10];

       const prepareObject = existModule.prepare();

       expect(prepareObject.query).toEqual(expectedQuery);
       expect(prepareObject.bindings).toEqual(expectedBindings);
    });

    test("It builds a query string", () => {
        const expectedQuery = "SELECT EXISTS(SELECT * FROM `users` WHERE `id` = 10)";

        const queryString = existModule.toString();

        expect(queryString).toEqual(expectedQuery);
    });
});