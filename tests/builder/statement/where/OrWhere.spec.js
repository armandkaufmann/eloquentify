import {describe, expect, test} from 'vitest';
import OrWhere from "../../../../src/builder/statement/where/OrWhere.js";
import Where from "../../../../src/builder/statement/where/Where.js";
import {InvalidComparisonOperatorError} from "../../../../src/errors/QueryBuilder/Errors.js";

describe("Statement: OrWhere", () => {
    describe("toString", () => {
       test("It builds a partial statement", () => {
           const column = "users";
           const operator = '=';
           const value = "John";
           const expectedResult = "`users` = 'John'";

           const result = new OrWhere(column, operator, value).toString();

           expect(result).toEqual(expectedResult);
       });

        test("It throws when an invalid operator is passed in", () => {
            const column = 'users';
            const operator = 'sheep';
            const value = 'John';

            expect(() => new OrWhere(column, operator, value)).toThrow(InvalidComparisonOperatorError);
        });

        test("It defaults the operator to equals if no value is passed in", () => {
            const column = 'users';
            const value = 'John';
            const expectedResult = "`users` = 'John'";

            const result = new OrWhere(column, value).toString();

            expect(result).toEqual(expectedResult);
        });

       test("It builds a partial statement with separator", () => {
           const column = 'users';
           const operator = '=';
           const value = 'John';
           const expectedResult = "OR `users` = 'John'";

           const result = new OrWhere(column, operator, value).toString(true);

           expect(result).toEqual(expectedResult);
       })
    });

    describe("Prepare", () => {
        test("It builds a prepare object", () => {
            const column = 'users';
            const operator = '=';
            const value = 'John';

            const expectedBindings = [value];
            const expectedQuery = "`users` = ?";

            const result = new OrWhere(column, operator, value).prepare();

            expect(result.query).toEqual(expectedQuery);
            expect(result.bindings).toEqual(expectedBindings);
        });

        test("It builds a prepare object with separator", () => {
            const column = 'users';
            const operator = '=';
            const value = 'John';

            const expectedBindings = [value];
            const expectedQuery = "OR `users` = ?";

            const result = new OrWhere(column, operator, value).prepare(true);

            expect(result.query).toEqual(expectedQuery);
            expect(result.bindings).toEqual(expectedBindings);
        });
    });
});