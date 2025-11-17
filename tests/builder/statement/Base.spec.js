import {describe, expect, test} from 'vitest';
import {Base} from "../../../src/builder/statement/Base.js";

describe("Statement: Base Test", () => {
    describe("ToString", () => {
        test("It builds a query string from prepared query string and bindings array", () => {
            const query = "WHERE name = ? AND age > ?";
            const bindings = ['John', 20];
            const expectedString = "WHERE name = 'John' AND age > 20";

            const result = new Base(bindings, query, 'AND').toString()

            expect(result).toEqual(expectedString);
        });

        test("It builds a query string with prefixed condition", () => {
            const query = "WHERE name = ? AND age > ?";
            const bindings = ['John', 20];
            const expectedString = "AND WHERE name = 'John' AND age > 20";

            const result = new Base(bindings, query, 'AND').toString(true)

            expect(result).toEqual(expectedString);
        });
    });

    describe("Prepare", () => {
        test("It returns a prepare object", () => {
            const query = "WHERE name = ? AND age > ?";
            const bindings = ['John', 20];
            const expectedObject = {
                query, bindings
            };

            const result = new Base(bindings, query, 'AND').prepare()

            expect(result).toEqual(expectedObject);
        });

        test("It returns a object with prefixed condition in query string", () => {
            const query = "WHERE name = ? AND age > ?";
            const bindings = ['John', 20];
            const expectedObject = {
                query: "AND " + query, bindings
            };

            const result = new Base(bindings, query, 'AND').prepare(true)

            expect(result).toEqual(expectedObject);
        });
    });

    describe("Clone", () => {
        test("It clones the base class", () => {
            const query = "WHERE name = ? AND age > ?";
            const bindings = ['John', 20];
            const expectedString = "WHERE name = 'John' AND age > 20";

            const originalClass =  new Base(bindings, query, 'AND');
            const originalResult = originalClass.toString();

            const clonedClass = originalClass.clone();
            const clonedResult = clonedClass.toString();

            expect(originalResult).toEqual(expectedString);
            expect(originalResult).toEqual(clonedResult);
        });
    })

});