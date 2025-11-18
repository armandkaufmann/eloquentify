import {describe, expect, test} from 'vitest';
import Where from "../../../../src/builder/statement/where/Where.js";
import WhereNot from "../../../../src/builder/statement/where/WhereNot.js";

describe('Statement: WhereNot', () => {
    describe('toString', () => {
       test("It builds partial statement", () => {
           const column = 'users';
           const operator = '=';
           const value = 'John';
           const expectedResult = "NOT `users` = 'John'";

           const result = new WhereNot(column, operator, value).toString();

           expect(result).toEqual(expectedResult);
       });

        test("It builds with separator", () => {
            const column = 'users';
            const operator = '=';
            const value = 'John';
            const expectedResult = "AND NOT `users` = 'John'";

            const result = new WhereNot(column, operator, value).toString(true);

            expect(result).toEqual(expectedResult);
        });
    });

    describe('Prepare', () => {
        test("It builds prepared object partial statement", () => {
            const column = 'users';
            const operator = '=';
            const value = 'John';

            const expectedBindings = [value];
            const expectedQuery = "NOT `users` = ?";

            const result = new WhereNot(column, operator, value).prepare();

            expect(result.query).toEqual(expectedQuery);
            expect(result.bindings).toEqual(expectedBindings);
        });

        test("It builds prepared object statement with separator", () => {
            const column = 'users';
            const operator = '=';
            const value = 'John';

            const expectedBindings = [value];
            const expectedQuery = "AND NOT `users` = ?";

            const result = new WhereNot(column, operator, value).prepare(true);

            expect(result.query).toEqual(expectedQuery);
            expect(result.bindings).toEqual(expectedBindings);
        });
    });
});