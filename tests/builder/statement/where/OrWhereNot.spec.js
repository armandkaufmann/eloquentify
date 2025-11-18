import {describe, expect, test} from 'vitest';
import {InvalidComparisonOperatorError} from "../../../../src/errors/QueryBuilder/Errors.js";
import OrWhereNot from "../../../../src/builder/statement/where/OrWhereNot.js";

describe('Statement: OrWhereNot', () => {
    describe('toString', () => {
       test("It builds partial statement", () => {
           const column = 'users';
           const operator = '=';
           const value = 'John';
           const expectedResult = "NOT `users` = 'John'";

           const result = new OrWhereNot(column, operator, value).toString();

           expect(result).toEqual(expectedResult);
       });

        test("It defaults operator to equals when value is not passed in", () => {
            const column = 'users';
            const value = 'John';
            const expectedResult = "NOT `users` = 'John'";

            const result = new OrWhereNot(column, value).toString();

            expect(result).toEqual(expectedResult);
        });

        test("It throws when an invalid operator is passed in", () => {
            const column = 'users';
            const operator = 'sheep';
            const value = 'John';

            expect(() => new OrWhereNot(column, operator, value)).toThrow(InvalidComparisonOperatorError);
        });

        test("It builds with separator", () => {
            const column = 'users';
            const operator = '=';
            const value = 'John';
            const expectedResult = "OR NOT `users` = 'John'";

            const result = new OrWhereNot(column, operator, value).toString(true);

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

            const result = new OrWhereNot(column, operator, value).prepare();

            expect(result.query).toEqual(expectedQuery);
            expect(result.bindings).toEqual(expectedBindings);
        });

        test("It builds prepared object statement with separator", () => {
            const column = 'users';
            const operator = '=';
            const value = 'John';

            const expectedBindings = [value];
            const expectedQuery = "OR NOT `users` = ?";

            const result = new OrWhereNot(column, operator, value).prepare(true);

            expect(result.query).toEqual(expectedQuery);
            expect(result.bindings).toEqual(expectedBindings);
        });
    });
});