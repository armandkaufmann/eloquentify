import {describe, expect, beforeEach, test, vi} from 'vitest';
import {Query} from "../../src/builder/Query.js";
import {
    InvalidComparisonOperatorError,
    InvalidBetweenValueArrayLength,
    TableNotSetError, MissingRequiredArgument
} from "../../src/errors/QueryBuilder/Errors.js";
import {DB} from "../../src/DB.js";

vi.mock("../../src/DB.js", () => {
    const DB = vi.fn();
    DB.prototype.insert = vi.fn();
    DB.prototype.all = vi.fn();
    DB.prototype.get = vi.fn();
    DB.prototype.updateOrDelete = vi.fn();

    return {DB}
});

describe("QueryBuilderTest", () => {
    describe("Building Query Strings", () => {
        describe("To Sql", () => {
            test("Base query string", async () => {
                const result = await new Query()
                    .from('my_table')
                    .toSql()
                    .get();

                expect(result).toBe("SELECT * FROM `my_table`");
            });

            describe("Throws when table is not set", () => {
                let query = null;

                beforeEach(() => {
                    query = new Query();
                });

                test("Get", async () => {
                    await expect(async () => await query.get()).rejects.toThrow(TableNotSetError);
                });

                test("First", async () => {
                    await expect(async () => await new Query().first()).rejects.toThrow(TableNotSetError);
                });

                test("Insert", async () => {
                    await expect(async () => await query.insert({taco: 'tuesday'})).rejects.toThrowError(TableNotSetError);
                });

                test("Update", async () => {
                    await expect(async () => await query.update({taco: 'tuesday'})).rejects.toThrow(TableNotSetError);
                });
            })

            test("Select", async () => {
                const result = await Query
                    .from('my_table')
                    .toSql()
                    .get();

                const expectedResult = "SELECT * FROM `my_table`";

                expect(result).toBe(expectedResult);
            });

            test("builds full query in correct order", async () => {
                const result = await Query.toSql()
                    .from('my_table')
                    .where('name', '=', 'John')
                    .select('id', 'name')
                    .limit(2)
                    .groupBy('class')
                    .offset(5)
                    .leftJoin('comments', 'my_table.id', '=', 'comments.my_table_id')
                    .orderBy('id')
                    .having('class', 'LIKE', '%example%')
                    .get();

                const expectedResult = "SELECT `id`, `name` FROM `my_table` LEFT JOIN `comments` ON `my_table`.`id` = `comments`.`my_table_id` WHERE `name` = 'John' GROUP BY `class` HAVING `class` LIKE '%example%' ORDER BY `id` ASC LIMIT 2 OFFSET 5"

                expect(result).toBe(expectedResult);
            });
        });

        describe("When", () => {
            test("Only calls callback when condition is true", async () => {
                let callbackCallCount = 0;
                const callback = () => {
                    callbackCallCount += 1;
                }

                await new Query()
                    .from('my_table')
                    .when(true, callback)
                    .toSql()
                    .get();

                expect(callbackCallCount).toEqual(1);
            });

            test("Only calls callback when expression is true", async () => {
                let callbackCallCount = 0;
                const callback = () => {
                    callbackCallCount += 1;
                }

                const expression = () => {
                    return true;
                }

                await new Query()
                    .from('my_table')
                    .when(expression, callback)
                    .toSql()
                    .get();

                expect(callbackCallCount).toEqual(1);
            });

            test("Does not call callback when value expression returns false", async () => {
                let callbackCallCount = 0;
                const callback = () => {
                    callbackCallCount += 1;
                }

                const expression = () => {
                    return false;
                }

                await new Query()
                    .from('my_table')
                    .when(expression, callback)
                    .toSql()
                    .get();

                expect(callbackCallCount).toEqual(0);
            });

            test("Does not call callback when condition is false", async () => {
                await new Query()
                    .from('my_table')
                    .when(false, () => {
                        expect(false).toEqual(true)
                    })
                    .toSql()
                    .get();
            });

            test("Query object is passed to the callback", async () => {
                await new Query()
                    .from('my_table')
                    .when(true, (object) => {
                        const isQueryObject = object instanceof Query;
                        expect(isQueryObject).toBe(true);
                    })
                    .toSql()
                    .get();

                expect.hasAssertions();
            });

            test("Can build query when condition is met", async () => {
                const result = await new Query()
                    .from('my_table')
                    .when(true, (query) => {
                        query.where('test_id', '=', 5);
                    })
                    .where('test_name', '=', 'John')
                    .toSql()
                    .get();

                const expectedResult = "SELECT * FROM `my_table` WHERE `test_id` = 5 AND `test_name` = 'John'";

                expect(result).toBe(expectedResult);
            });

            describe("Smart type casting", async () => {
                const types = [
                    ["Array truthy", ['waldo'], true],
                    ["Array NOT truthy", [], false],
                    ["Object truthy", {taco: "man"}, true],
                    ["Object NOT truthy", {}, false],
                    ["String truthy", "I'm a string Morty", true],
                    ["String NOT truthy", "", false],
                    ["Null NOT truthy", null, false],
                    ["Undefined NOT truthy", undefined, false],
                    ["Number NOT truthy", 1, false],
                ];

                test.each(types)('Smart type casting: %s', async (test, value, isTruthy) => {
                    const result = await new Query()
                        .toSql()
                        .from('my_table')
                        .when(value,
                            (query) => {
                                query.where('test_id', '=', 5);
                            },
                            (query) => {
                                query.where('test_id', '=', 10);
                            }
                        )
                        .where('test_name', '=', 'John')
                        .get();

                    let expectedResult;

                    if (isTruthy) {
                        expectedResult = "SELECT * FROM `my_table` WHERE `test_id` = 5 AND `test_name` = 'John'";
                    } else {
                        expectedResult = "SELECT * FROM `my_table` WHERE `test_id` = 10 AND `test_name` = 'John'";
                    }

                    expect(result).toBe(expectedResult);
                });

                test.each(types)('Smart type casting expression callback: %s', async (test, value, isTruthy) => {
                    let callbackCallCount = 0;
                    const callback = () => {
                        callbackCallCount += 1;
                    }

                    const defaultCallback = (query, callbackValue) => {
                        expect(callbackValue).toEqual(value);
                    }

                    const expression = () => {
                        return value;
                    }

                    await new Query()
                        .from('my_table')
                        .when(expression, callback, defaultCallback)
                        .toSql()
                        .get();

                    expect(callbackCallCount).toEqual(isTruthy ? 1 : 0);
                });
            });
        });

        describe("Where", () => {
            test("Query String", async () => {
                const result = await new Query()
                    .from('my_table')
                    .where('test_id', '=', 5)
                    .where('test_name', '=', 'John')
                    .toSql()
                    .get();

                const expectedResult = "SELECT * FROM `my_table` WHERE `test_id` = 5 AND `test_name` = 'John'";

                expect(result).toBe(expectedResult);
            });

            test("Operator defaults to equals when omitted", async () => {
                const result = await new Query()
                    .from('my_table')
                    .where('test_id', 5)
                    .where('test_name', 'John')
                    .toSql()
                    .get();

                const expectedResult = "SELECT * FROM `my_table` WHERE `test_id` = 5 AND `test_name` = 'John'";

                expect(result).toBe(expectedResult);
            });

            describe("Where Raw/Or Where Raw", () => {
                test("WhereRaw: Builds query string without bindings", async () => {
                    const result = await new Query()
                        .from('my_table')
                        .where('test_name', '=', 'John')
                        .whereRaw("price > IF(state = 'TX', 200, 100)")
                        .toSql()
                        .get();

                    const expectedResult = "SELECT * FROM `my_table` WHERE `test_name` = 'John' AND price > IF(state = 'TX', 200, 100)";

                    expect(result).toBe(expectedResult);
                });

                test("WhereRaw: Builds query string with bindings", async () => {
                    const result = await new Query()
                        .from('my_table')
                        .where('test_name', '=', 'John')
                        .whereRaw("price > IF(state = 'TX', ?, 100)", [200])
                        .toSql()
                        .get();

                    const expectedResult = "SELECT * FROM `my_table` WHERE `test_name` = 'John' AND price > IF(state = 'TX', 200, 100)";

                    expect(result).toBe(expectedResult);
                });

                test("OrWhereRaw: Builds query string without bindings", async () => {
                    const result = await new Query()
                        .from('my_table')
                        .where('test_name', '=', 'John')
                        .orWhereRaw("price > IF(state = 'TX', 200, 100)")
                        .toSql()
                        .get();

                    const expectedResult = "SELECT * FROM `my_table` WHERE `test_name` = 'John' OR price > IF(state = 'TX', 200, 100)";

                    expect(result).toBe(expectedResult);
                });

                test("OrWhereRaw: Builds query string with bindings", async () => {
                    const result = await new Query()
                        .from('my_table')
                        .where('test_name', '=', 'John')
                        .orWhereRaw("price > IF(state = 'TX', ?, 100)", [200])
                        .toSql()
                        .get();

                    const expectedResult = "SELECT * FROM `my_table` WHERE `test_name` = 'John' OR price > IF(state = 'TX', 200, 100)";

                    expect(result).toBe(expectedResult);
                });
            });

            describe("Where null/not null", () => {
                test("Builds where null query string", async () => {
                    const result = await new Query()
                        .from('my_table')
                        .where('test_name', '=', 'John')
                        .whereNull('test_id')
                        .toSql()
                        .get();

                    const expectedResult = "SELECT * FROM `my_table` WHERE `test_name` = 'John' AND `test_id` IS NULL";

                    expect(result).toBe(expectedResult);
                });

                test("Builds where null query string", async () => {
                    const result = await new Query()
                        .from('my_table')
                        .where('test_name', '=', 'John')
                        .whereNotNull('test_id')
                        .toSql()
                        .get();

                    const expectedResult = "SELECT * FROM `my_table` WHERE `test_name` = 'John' AND `test_id` IS NOT NULL";

                    expect(result).toBe(expectedResult);
                });
            });

            describe("Or Where null/Or not null", () => {
                test("orWhereNull: Builds where null query string", async () => {
                    const result = await new Query()
                        .from('my_table')
                        .where('test_name', '=', 'John')
                        .orWhereNull('test_id')
                        .toSql()
                        .get();

                    const expectedResult = "SELECT * FROM `my_table` WHERE `test_name` = 'John' OR `test_id` IS NULL";

                    expect(result).toBe(expectedResult);
                });

                test("orWhereNotNull: Builds where null query string", async () => {
                    const result = await new Query()
                        .from('my_table')
                        .where('test_name', '=', 'John')
                        .orWhereNotNull('test_id')
                        .toSql()
                        .get();

                    const expectedResult = "SELECT * FROM `my_table` WHERE `test_name` = 'John' OR `test_id` IS NOT NULL";

                    expect(result).toBe(expectedResult);
                });
            });

            describe("Where Any/Where All", () => {
                test("whereAny: Builds where query string", async () => {
                    const result = await new Query()
                        .from('my_table')
                        .where('test_name', '=', 'John')
                        .whereAny([
                            'name',
                            'email',
                            'phone',
                        ], 'LIKE', 'Example%')
                        .toSql()
                        .get();

                    const expectedResult = "SELECT * FROM `my_table` WHERE `test_name` = 'John' AND (`name` LIKE 'Example%' OR `email` LIKE 'Example%' OR `phone` LIKE 'Example%')";

                    expect(result).toBe(expectedResult);
                });

                test("whereAll: Builds where query string", async () => {
                    const result = await new Query()
                        .from('my_table')
                        .where('test_name', '=', 'John')
                        .whereAll([
                            'name',
                            'email',
                            'phone',
                        ], 'LIKE', 'Example%')
                        .toSql()
                        .get();

                    const expectedResult = "SELECT * FROM `my_table` WHERE `test_name` = 'John' AND (`name` LIKE 'Example%' AND `email` LIKE 'Example%' AND `phone` LIKE 'Example%')";

                    expect(result).toBe(expectedResult);
                });

                test("whereNot: Builds where query string", async () => {
                    const result = await new Query()
                        .from('my_table')
                        .where('test_name', '=', 'John')
                        .whereNot([
                            'name',
                            'email',
                            'phone',
                        ], 'LIKE', 'Example%')
                        .toSql()
                        .get();

                    const expectedResult = "SELECT * FROM `my_table` WHERE `test_name` = 'John' AND NOT (`name` LIKE 'Example%' OR `email` LIKE 'Example%' OR `phone` LIKE 'Example%')";

                    expect(result).toBe(expectedResult);
                });
            });

            describe("Or Where", () => {
                test("Does not add or if orWhere is called without an existing where", async () => {
                    const result = await Query.from('my_table')
                        .orWhere('test_id', '=', 5)
                        .toSql()
                        .get();

                    const expectedResult = "SELECT * FROM `my_table` WHERE `test_id` = 5";

                    expect(result).toBe(expectedResult);
                });

                test("Adds or in query with where before", async () => {
                    const result = await Query.from('my_table')
                        .where('name', '=', 'John')
                        .orWhere('test_id', '=', 5)
                        .toSql()
                        .get();

                    const expectedResult = "SELECT * FROM `my_table` WHERE `name` = 'John' OR `test_id` = 5";

                    expect(result).toBe(expectedResult);
                });

                test("Operator defaults to equals when omitted", async () => {
                    const result = await Query.from('my_table')
                        .where('name', '=', 'John')
                        .orWhere('test_id', 5)
                        .toSql()
                        .get();

                    const expectedResult = "SELECT * FROM `my_table` WHERE `name` = 'John' OR `test_id` = 5";

                    expect(result).toBe(expectedResult);
                });
            });

            describe("Where in/not in", () => {
                test("Builds where in query string", async () => {
                    const result = await Query.from('users')
                        .whereIn('name', ['John', 'James', 'Bob'])
                        .whereIn('id', [1, 5, 7])
                        .toSql()
                        .get();

                    const expectedResult = "SELECT * FROM `users` WHERE `name` IN ('John', 'James', 'Bob') AND `id` IN (1, 5, 7)";

                    expect(result).toBe(expectedResult);
                });

                test("Builds or where in query string", async () => {
                    const result = await Query.from('users')
                        .whereIn('name', ['John', 'James', 'Bob'])
                        .orWhereIn('id', [1, 5, 7])
                        .toSql()
                        .get();

                    const expectedResult = "SELECT * FROM `users` WHERE `name` IN ('John', 'James', 'Bob') OR `id` IN (1, 5, 7)";

                    expect(result).toBe(expectedResult);
                });

                test("Builds where not in query string", async () => {
                    const result = await Query.from('users')
                        .whereIn('name', ['John', 'James', 'Bob'])
                        .whereNotIn('id', [1, 5, 7])
                        .toSql()
                        .get();

                    const expectedResult = "SELECT * FROM `users` WHERE `name` IN ('John', 'James', 'Bob') AND `id` NOT IN (1, 5, 7)";

                    expect(result).toBe(expectedResult);
                });

                test("Builds or where not in query string", async () => {
                    const result = await Query.from('users')
                        .whereIn('name', ['John', 'James', 'Bob'])
                        .orWhereNotIn('id', [1, 5, 7])
                        .toSql()
                        .get();

                    const expectedResult = "SELECT * FROM `users` WHERE `name` IN ('John', 'James', 'Bob') OR `id` NOT IN (1, 5, 7)";

                    expect(result).toBe(expectedResult);
                });
            });

            describe("Where callback", () => {
                describe("Where", () => {
                    test("It groups where statement with callback", async () => {
                        const query = Query.from('salary')
                            .select(Query.raw(1))
                            .where('name', 'John');

                        const result = await Query
                            .from('users')
                            .toSql()
                            .where(($query) => {
                                $query
                                    .where('name', '=', 'John')
                                    .whereExists(query)
                                    .orWhere('id', '>', 1);
                            })
                            .where('age', '>', 90)
                            .get();

                        const expectedResult = "SELECT * FROM `users` WHERE (`name` = 'John' AND EXISTS (SELECT 1 FROM `salary` WHERE `name` = 'John') OR `id` > 1) AND `age` > 90";

                        expect(result).toBe(expectedResult);
                    });

                    test("It can correctly add grouped where with an existing where", async () => {
                        const result = await Query
                            .from('users')
                            .toSql()
                            .where('age', '>', 90)
                            .where(($query) => {
                                $query
                                    .where('name', '=', 'John')
                                    .orWhere('id', '>', 1);
                            })
                            .orWhere('position', '=', 'accountant')
                            .get();

                        const expectedResult = "SELECT * FROM `users` WHERE `age` > 90 AND (`name` = 'John' OR `id` > 1) OR `position` = 'accountant'";

                        expect(result).toBe(expectedResult);
                    });
                });

                describe("Or Where", () => {
                    test("It groups or where statement with callback in typical use case", async () => {
                        const result = await Query
                            .from('users')
                            .toSql()
                            .where('age', '>', 90)
                            .orWhere(($query) => {
                                $query
                                    .where('name', '=', 'John')
                                    .orWhere('id', '>', 1);
                            })
                            .get();

                        const expectedResult = "SELECT * FROM `users` WHERE `age` > 90 OR (`name` = 'John' OR `id` > 1)";

                        expect(result).toBe(expectedResult);
                    });

                    test("It groups or where statement with callback when only single where statement", async () => {
                        const result = await Query
                            .from('users')
                            .toSql()
                            .orWhere(($query) => {
                                $query
                                    .where('name', '=', 'John')
                                    .orWhere('id', '>', 1);
                            })
                            .get();

                        const expectedResult = "SELECT * FROM `users` WHERE (`name` = 'John' OR `id` > 1)";

                        expect(result).toBe(expectedResult);
                    });
                })
            });

            describe("Where between/not between", () => {
                test("It groups or where statement with callback in typical use case", async () => {
                    const result = await Query
                        .from('users')
                        .toSql()
                        .where('id', '>', 1)
                        .whereBetween('age', [18, 25])
                        .get();

                    const expectedResult = "SELECT * FROM `users` WHERE `id` > 1 AND `age` BETWEEN 18 AND 25";

                    expect(result).toBe(expectedResult);
                });

                test("It groups or where statement with callback in typical use case", async () => {
                    const result = await Query
                        .from('users')
                        .toSql()
                        .whereNotBetween('age', [18, 25])
                        .get();

                    const expectedResult = "SELECT * FROM `users` WHERE `age` NOT BETWEEN 18 AND 25";

                    expect(result).toBe(expectedResult);
                });
            });

            describe("Where or between/or not between", () => {
                test("orWhereBetween: It groups or where statement with callback in typical use case", async () => {
                    const result = await Query
                        .from('users')
                        .toSql()
                        .where('id', '>', 1)
                        .orWhereBetween('age', [18, 25])
                        .get();

                    const expectedResult = "SELECT * FROM `users` WHERE `id` > 1 OR `age` BETWEEN 18 AND 25";

                    expect(result).toBe(expectedResult);
                });

                test("orWhereBetween: It does not add the OR if there is no previous where query", async () => {
                    const result = await Query
                        .from('users')
                        .toSql()
                        .orWhereBetween('age', [18, 25])
                        .get();

                    const expectedResult = "SELECT * FROM `users` WHERE `age` BETWEEN 18 AND 25";

                    expect(result).toBe(expectedResult);
                });

                test("orWhereNotBetween: It groups or where statement with callback in typical use case", async () => {
                    const result = await Query
                        .from('users')
                        .toSql()
                        .where('id', '>', 1)
                        .orWhereNotBetween('age', [18, 25])
                        .get();

                    const expectedResult = "SELECT * FROM `users` WHERE `id` > 1 OR `age` NOT BETWEEN 18 AND 25";

                    expect(result).toBe(expectedResult);
                });

                test("orWhereNotBetween: It does not add the OR if there is no previous where query", async () => {
                    const result = await Query
                        .from('users')
                        .toSql()
                        .orWhereNotBetween('age', [18, 25])
                        .get();

                    const expectedResult = "SELECT * FROM `users` WHERE `age` NOT BETWEEN 18 AND 25";

                    expect(result).toBe(expectedResult);
                });
            });

            describe("Where column/where between columns/where not between columns", () => {
                test("whereColumn", async () => {
                    const result = await Query
                        .from('users')
                        .toSql()
                        .where('id', '>', 1)
                        .whereColumn('created_at', 'updated_at')
                        .get();

                    const expectedResult = "SELECT * FROM `users` WHERE `id` > 1 AND `created_at` = `updated_at`";

                    expect(result).toBe(expectedResult);
                });

                test("orWhereColumn", async () => {
                    const result = await Query
                        .from('users')
                        .toSql()
                        .where('id', '>', 1)
                        .orWhereColumn('created_at', 'updated_at')
                        .get();

                    const expectedResult = "SELECT * FROM `users` WHERE `id` > 1 OR `created_at` = `updated_at`";

                    expect(result).toBe(expectedResult);
                });

                test("whereBetweenColumns", async () => {
                    const result = await Query
                        .from('users')
                        .toSql()
                        .where('id', '>', 1)
                        .whereBetweenColumns('created_at', ['updated_at', 'deleted_at'])
                        .get();

                    const expectedResult = "SELECT * FROM `users` WHERE `id` > 1 AND `created_at` BETWEEN `updated_at` AND `deleted_at`";

                    expect(result).toBe(expectedResult);
                });

                test("orWhereBetweenColumns", async () => {
                    const result = await Query
                        .from('users')
                        .toSql()
                        .where('id', '>', 1)
                        .orWhereBetweenColumns('created_at', ['updated_at', 'deleted_at'])
                        .get();

                    const expectedResult = "SELECT * FROM `users` WHERE `id` > 1 OR `created_at` BETWEEN `updated_at` AND `deleted_at`";

                    expect(result).toBe(expectedResult);
                });

                test("WhereNotBetweenColumns", async () => {
                    const result = await Query
                        .from('users')
                        .toSql()
                        .where('id', '>', 1)
                        .whereNotBetweenColumns('created_at', ['updated_at', 'deleted_at'])
                        .get();

                    const expectedResult = "SELECT * FROM `users` WHERE `id` > 1 AND `created_at` NOT BETWEEN `updated_at` AND `deleted_at`";

                    expect(result).toBe(expectedResult);
                });

                test("OrWhereNotBetweenColumns", async () => {
                    const result = await Query
                        .from('users')
                        .toSql()
                        .where('id', '>', 1)
                        .orWhereNotBetweenColumns('created_at', ['updated_at', 'deleted_at'])
                        .get();

                    const expectedResult = "SELECT * FROM `users` WHERE `id` > 1 OR `created_at` NOT BETWEEN `updated_at` AND `deleted_at`";

                    expect(result).toBe(expectedResult);
                });
            });

            describe("Where Exists/Where Not Exists", () => {
                test("WhereExists Callback: Builds query string", async () => {
                    const result = await Query.from('taco_truck')
                        .toSql()
                        .where('item', 'Burrito')
                        .whereExists((query) => {
                            return query
                                .from('stock')
                                .select(Query.raw(1))
                                .where('item', 'Burrito');
                        })
                        .get();

                    const expectedResult = "SELECT * FROM `taco_truck` WHERE `item` = 'Burrito' AND EXISTS (SELECT 1 FROM `stock` WHERE `item` = 'Burrito')"

                    expect(result).toEqual(expectedResult)
                });

                test("WhereExists Query Arg: Builds query string", async () => {
                    const query = Query.from('stock')
                        .select(Query.raw(1))
                        .where('item', 'Burrito');

                    const result = await Query.from('taco_truck')
                        .toSql()
                        .where('item', 'Burrito')
                        .whereExists(query)
                        .get();

                    const expectedResult = "SELECT * FROM `taco_truck` WHERE `item` = 'Burrito' AND EXISTS (SELECT 1 FROM `stock` WHERE `item` = 'Burrito')"

                    expect(result).toEqual(expectedResult)
                });

                test("OrWhereExists Callback: Builds query string", async () => {
                    const result = await Query.from('taco_truck')
                        .toSql()
                        .where('item', 'Burrito')
                        .orWhereExists((query) => {
                            return query
                                .from('stock')
                                .select(Query.raw(1))
                                .where('item', 'Burrito');
                        })
                        .get();

                    const expectedResult = "SELECT * FROM `taco_truck` WHERE `item` = 'Burrito' OR EXISTS (SELECT 1 FROM `stock` WHERE `item` = 'Burrito')"

                    expect(result).toEqual(expectedResult)
                });

                test("OrWhereExists Query Arg: Builds query string", async () => {
                    const query = Query.from('stock')
                        .select(Query.raw(1))
                        .where('item', 'Burrito');

                    const result = await Query.from('taco_truck')
                        .toSql()
                        .where('item', 'Burrito')
                        .orWhereExists(query)
                        .get();

                    const expectedResult = "SELECT * FROM `taco_truck` WHERE `item` = 'Burrito' OR EXISTS (SELECT 1 FROM `stock` WHERE `item` = 'Burrito')"

                    expect(result).toEqual(expectedResult)
                });

                test("WhereNotExists Callback: Builds query string", async () => {
                    const result = await Query.from('taco_truck')
                        .toSql()
                        .where('item', 'Burrito')
                        .whereNotExists((query) => {
                            return query
                                .from('stock')
                                .select(Query.raw(1))
                                .where('item', 'Burrito');
                        })
                        .get();

                    const expectedResult = "SELECT * FROM `taco_truck` WHERE `item` = 'Burrito' AND NOT EXISTS (SELECT 1 FROM `stock` WHERE `item` = 'Burrito')"

                    expect(result).toEqual(expectedResult)
                });

                test("WhereNotExists Query Arg: Builds query string", async () => {
                    const query = Query.from('stock')
                        .select(Query.raw(1))
                        .where('item', 'Burrito');

                    const result = await Query.from('taco_truck')
                        .toSql()
                        .where('item', 'Burrito')
                        .whereNotExists(query)
                        .get();

                    const expectedResult = "SELECT * FROM `taco_truck` WHERE `item` = 'Burrito' AND NOT EXISTS (SELECT 1 FROM `stock` WHERE `item` = 'Burrito')"

                    expect(result).toEqual(expectedResult)
                });

                test("OrWhereNotExists Callback: Builds query string", async () => {
                    const result = await Query.from('taco_truck')
                        .toSql()
                        .where('item', 'Burrito')
                        .orWhereNotExists((query) => {
                            return query
                                .from('stock')
                                .select(Query.raw(1))
                                .where('item', 'Burrito');
                        })
                        .get();

                    const expectedResult = "SELECT * FROM `taco_truck` WHERE `item` = 'Burrito' OR NOT EXISTS (SELECT 1 FROM `stock` WHERE `item` = 'Burrito')"

                    expect(result).toEqual(expectedResult)
                });

                test("OrWhereNotExists Query Arg: Builds query string", async () => {
                    const query = Query.from('stock')
                        .select(Query.raw(1))
                        .where('item', 'Burrito');

                    const result = await Query.from('taco_truck')
                        .toSql()
                        .where('item', 'Burrito')
                        .orWhereNotExists(query)
                        .get();

                    const expectedResult = "SELECT * FROM `taco_truck` WHERE `item` = 'Burrito' OR NOT EXISTS (SELECT 1 FROM `stock` WHERE `item` = 'Burrito')"

                    expect(result).toEqual(expectedResult)
                });
            });
        });

        describe("Select", () => {
            test("Select query string", async () => {
                const result = await new Query()
                    .from('test_models')
                    .select('test_id', 'test_name')
                    .toSql()
                    .get();

                const expectedResult = "SELECT `test_id`, `test_name` FROM `test_models`";

                expect(result).toBe(expectedResult);
            });

            describe("Distinct:", () => {
                test("it builds select statement with distinct", async () => {
                    const result = await new Query()
                        .from('test_models')
                        .distinct()
                        .select('test_id', 'test_name')
                        .toSql()
                        .get();

                    const expectedResult = "SELECT DISTINCT `test_id`, `test_name` FROM `test_models`";

                    expect(result).toBe(expectedResult);
                });

                test("it does not DISTINCT when there is no specified select", async () => {
                    const result = await new Query()
                        .from('test_models')
                        .distinct()
                        .toSql()
                        .get();

                    const expectedResult = "SELECT * FROM `test_models`";

                    expect(result).toBe(expectedResult);
                });
            });

            describe("Select Raw:", () => {
                test("Builds query string with binding", async () => {
                    const result = await new Query()
                        .from('test_models')
                        .select('test_id', 'test_name')
                        .selectRaw('price * ? as price_with_tax', [1.0825])
                        .toSql()
                        .get();

                    const expectedResult = "SELECT `test_id`, `test_name`, price * 1.0825 as price_with_tax FROM `test_models`";

                    expect(result).toBe(expectedResult);
                });

                test("Builds query string without binding", async () => {
                    const result = await new Query()
                        .from('test_models')
                        .select('test_id', 'test_name')
                        .selectRaw('price as price_with_tax')
                        .toSql()
                        .get();

                    const expectedResult = "SELECT `test_id`, `test_name`, price as price_with_tax FROM `test_models`";

                    expect(result).toBe(expectedResult);
                });
            });
        });

        describe("Join", () => {
            test('builds query to join a table', async () => {
                const result = await new Query()
                    .from('users')
                    .select('users.id', 'users.name', 'posts.title')
                    .join('posts', 'users.id', '=', 'posts.user_id')
                    .toSql()
                    .get();

                const expectedResult = "SELECT `users`.`id`, `users`.`name`, `posts`.`title` FROM `users` INNER JOIN `posts` ON `users`.`id` = `posts`.`user_id`";

                expect(result).toBe(expectedResult);
            });

            test('builds query with multiple joins', async () => {
                const result = await new Query()
                    .from('users')
                    .select('users.id', 'users.name', 'posts.title')
                    .join('posts', 'users.id', '=', 'posts.user_id')
                    .join('comments', 'users.id', '=', 'comments.user_id')
                    .toSql()
                    .get();

                const expectedResult = "SELECT `users`.`id`, `users`.`name`, `posts`.`title` FROM `users` INNER JOIN `posts` ON `users`.`id` = `posts`.`user_id` INNER JOIN `comments` ON `users`.`id` = `comments`.`user_id`";

                expect(result).toBe(expectedResult);
            });

            describe('Left Join', () => {
                test('builds query to left join a table', async () => {
                    const result = await new Query()
                        .from('users')
                        .select('users.id', 'users.name', 'posts.title')
                        .leftJoin('posts', 'users.id', '=', 'posts.user_id')
                        .toSql()
                        .get();

                    const expectedResult = "SELECT `users`.`id`, `users`.`name`, `posts`.`title` FROM `users` LEFT JOIN `posts` ON `users`.`id` = `posts`.`user_id`";

                    expect(result).toBe(expectedResult);
                });
            });

            describe('Cross Join', () => {
                test('builds query to cross join a table', async () => {
                    const result = await new Query()
                        .from('users')
                        .select('users.id', 'users.name', 'posts.title')
                        .crossJoin('comments')
                        .toSql()
                        .get();

                    const expectedResult = "SELECT `users`.`id`, `users`.`name`, `posts`.`title` FROM `users` CROSS JOIN `comments`";

                    expect(result).toBe(expectedResult);
                });
            });
        });

        describe("Order by", () => {
            test("Order by query string", async () => {
                const result = await new Query()
                    .from('my_table')
                    .orderBy('test_id')
                    .orderBy('test_name', 'DESC')
                    .orderByDesc('name')
                    .toSql()
                    .get();

                const expectedResult = "SELECT * FROM `my_table` ORDER BY `test_id` ASC, `test_name` DESC, `name` DESC";

                expect(result).toBe(expectedResult);
            });

            test("Order by raw query string", async () => {
                const result = await new Query()
                    .from('my_table')
                    .orderBy('test_id')
                    .orderByRaw('length(name) DESC')
                    .orderByDesc('name')
                    .toSql()
                    .get();

                const expectedResult = "SELECT * FROM `my_table` ORDER BY `test_id` ASC, length(name) DESC, `name` DESC";

                expect(result).toBe(expectedResult);
            });
        });

        describe("Group by", () => {
            test("Group by query string", async () => {
                const result = await new Query()
                    .from('my_table')
                    .groupBy('test_id', 'test_name')
                    .toSql()
                    .get();

                expect(result).toBe("SELECT * FROM `my_table` GROUP BY `test_id`, `test_name`");
            });

            test("Group by raw query string", async () => {
                const result = await new Query()
                    .from('my_table')
                    .groupBy('test_id', 'test_name')
                    .groupByRaw('role, location')
                    .toSql()
                    .get();

                expect(result).toBe("SELECT * FROM `my_table` GROUP BY `test_id`, `test_name`, role, location");
            });
        });

        describe("Having", () => {
            test("Having query string", async () => {
                const result = await new Query()
                    .from('my_table')
                    .having('test_id', 5)
                    .having('test_name', '=', 'test')
                    .toSql()
                    .get();

                expect(result).toBe("SELECT * FROM `my_table` HAVING `test_id` = 5 AND `test_name` = 'test'");
            });

            describe("Having Raw", () => {
                test("Having raw query string", async () => {
                    const result = await new Query()
                        .from('orders')
                        .having('name', '=', 'test')
                        .havingRaw('SUM(price) > ?', [2500])
                        .toSql()
                        .get();

                    expect(result).toBe("SELECT * FROM `orders` HAVING `name` = 'test' AND SUM(price) > 2500");
                });

                test("Having raw query string with multiple values", async () => {
                    const result = await new Query()
                        .from('orders')
                        .having('name', '=', 'test')
                        .havingRaw('SUM(price) > ? AND SUM(price) < ? AND description = ?', [2500, 5000, "test"])
                        .toSql()
                        .get();

                    expect(result).toBe("SELECT * FROM `orders` HAVING `name` = 'test' AND SUM(price) > 2500 AND SUM(price) < 5000 AND description = 'test'");
                });
            });

            describe("orHaving/orHavingRaw", () => {
                describe("OrHaving", () => {
                    test("Or Having with a previous statement statement", async () => {
                        const result = await new Query()
                            .from('my_table')
                            .having('test_id', '=', 5)
                            .orHaving('test_name', 'test')
                            .toSql()
                            .get();

                        expect(result).toBe("SELECT * FROM `my_table` HAVING `test_id` = 5 OR `test_name` = 'test'");
                    });

                    test("Doesn't apply Or when no previous having statement", async () => {
                        const result = await new Query()
                            .from('my_table')
                            .orHaving('test_name', '=', 'test')
                            .toSql()
                            .get();

                        expect(result).toBe("SELECT * FROM `my_table` HAVING `test_name` = 'test'");
                    });
                });

                describe("OrHavingRaw", () => {
                    test("Or Having Raw with a previous statement", async () => {
                        const result = await new Query()
                            .from('my_table')
                            .having('test_id', '=', 5)
                            .orHavingRaw('SUM(price) > ?', [2500])
                            .toSql()
                            .get();

                        expect(result).toBe("SELECT * FROM `my_table` HAVING `test_id` = 5 OR SUM(price) > 2500");
                    });

                    test("Doesn't apply Or when no previous having raw statement", async () => {
                        const result = await new Query()
                            .from('my_table')
                            .orHavingRaw('SUM(price) > ?', [2500])
                            .toSql()
                            .get();

                        expect(result).toBe("SELECT * FROM `my_table` HAVING SUM(price) > 2500");
                    });
                });
            });

            describe("HavingBetween/OrHavingBetween", () => {
                test("Having between query string", async () => {
                    const result = await new Query()
                        .from('orders')
                        .having('name', '=', 'test')
                        .havingBetween('orders', [5, 15])
                        .toSql()
                        .get();

                    expect(result).toBe("SELECT * FROM `orders` HAVING `name` = 'test' AND `orders` BETWEEN 5 AND 15");
                });

                test("Or Having between query string", async () => {
                    const result = await new Query()
                        .from('orders')
                        .having('name', '=', 'test')
                        .orHavingBetween('orders', [5, 15])
                        .toSql()
                        .get();

                    expect(result).toBe("SELECT * FROM `orders` HAVING `name` = 'test' OR `orders` BETWEEN 5 AND 15");
                });
            });

            describe("Having callback", () => {
                describe("Having", () => {
                    test("It groups 'HAVING' statement with callback", async () => {
                        const result = await Query
                            .from('users')
                            .toSql()
                            .groupBy('account_id')
                            .having(($query) => {
                                $query
                                    .having("account_id", '>', 100)
                                    .havingBetween("order_count", [5, 15])
                                    .orHaving("purchase_count", 5);
                            })
                            .get();

                        const expectedResult = [
                            "SELECT * FROM `users`",
                            "GROUP BY `account_id`",
                            "HAVING (`account_id` > 100 AND `order_count` BETWEEN 5 AND 15 OR `purchase_count` = 5)"
                        ];

                        expect(result).toBe(expectedResult.join(" "));
                    });

                    test("It can correctly add grouped 'HAVING' with an existing 'HAVING'", async () => {
                        const result = await Query
                            .from("users")
                            .toSql()
                            .groupBy("account_id")
                            .having('age', '>', 90)
                            .having(($query) => {
                                $query
                                    .having("account_id", '>', 100)
                                    .havingBetween("order_count", [5, 15])
                                    .orHaving("purchase_count", 5);
                            })
                            .orHaving('size', 'xl')
                            .get();

                        const expectedResult = [
                            "SELECT * FROM `users`",
                            "GROUP BY `account_id`",
                            "HAVING `age` > 90",
                            "AND (`account_id` > 100 AND `order_count` BETWEEN 5 AND 15 OR `purchase_count` = 5)",
                            "OR `size` = 'xl'"
                        ];

                        expect(result).toBe(expectedResult.join(" "));
                    });
                });

                describe("Or Having", () => {
                    test("It groups 'OR HAVING' statement with callback in typical use case", async () => {
                        const result = await Query
                            .from("users")
                            .toSql()
                            .groupBy("account_id")
                            .having('age', '>', 90)
                            .orHaving(($query) => {
                                $query
                                    .having("account_id", '>', 100)
                                    .havingBetween("order_count", [5, 15])
                                    .orHaving("purchase_count", 5);
                            })
                            .having('size', 'xl')
                            .get();

                        const expectedResult = [
                            "SELECT * FROM `users`",
                            "GROUP BY `account_id`",
                            "HAVING `age` > 90",
                            "OR (`account_id` > 100 AND `order_count` BETWEEN 5 AND 15 OR `purchase_count` = 5)",
                            "AND `size` = 'xl'"
                        ];

                        expect(result).toBe(expectedResult.join(" "));
                    });

                    test("It groups 'OR HAVING' statement with callback when only single 'HAVING' statement", async () => {
                        const result = await Query
                            .from('users')
                            .toSql()
                            .groupBy('account_id')
                            .orHaving(($query) => {
                                $query
                                    .having("account_id", '>', 100)
                                    .havingBetween("order_count", [5, 15])
                                    .orHaving("purchase_count", 5);
                            })
                            .get();

                        const expectedResult = [
                            "SELECT * FROM `users`",
                            "GROUP BY `account_id`",
                            "HAVING (`account_id` > 100 AND `order_count` BETWEEN 5 AND 15 OR `purchase_count` = 5)"
                        ];

                        expect(result).toBe(expectedResult.join(" "));
                    });
                })
            });
        });

        describe("Limit", () => {
            test("Limit query string", async () => {
                const result = await new Query()
                    .from('my_table')
                    .limit(1)
                    .toSql()
                    .get();

                expect(result).toBe("SELECT * FROM `my_table` LIMIT 1");
            });
        });

        describe("First", () => {
            test("First query string", async () => {
                const result = await new Query()
                    .from('my_table')
                    .toSql()
                    .first();

                expect(result).toBe("SELECT * FROM `my_table` LIMIT 1");
            });
        });

        describe("Offset", () => {
            test("Offset query string", async () => {
                const result = await Query
                    .from("users")
                    .offset(5)
                    .toSql()
                    .get();

                expect(result).toBe("SELECT * FROM `users` OFFSET 5")
            });
        });

        describe("Insert", () => {
            test("Insert query string", async () => {
                const fields = {
                    name: 'john',
                    address: '123 Taco Lane Ave St'
                }

                const result = await Query.toSql().from('users').insert(fields);

                expect(result).toBe("INSERT INTO users (name, address) VALUES ('john', '123 Taco Lane Ave St')");
            });
        });

        describe("Update", () => {
            test("Builds full update query string", async () => {
                const fields = {
                    name: 'john',
                    address: '123 Taco Lane Ave St'
                }

                const result = await Query
                    .toSql()
                    .from('users')
                    .where('id', '=', 5)
                    .limit(5)
                    .offset(5)
                    .orderBy('name')
                    .update(fields);

                expect(result).toBe("UPDATE `users` SET name = 'john', address = '123 Taco Lane Ave St' WHERE `id` = 5 ORDER BY `name` ASC LIMIT 5");
            })
        });

        describe("Raw", () => {
            describe("Select", () => {
                test("Insert raw statement: Select", async () => {
                    const result = await new Query()
                        .from('test_models')
                        .select('test_id', Query.raw('COUNT(*) as count'))
                        .toSql()
                        .get();

                    const expectedResult = "SELECT `test_id`, COUNT(*) as count FROM `test_models`";

                    expect(result).toBe(expectedResult);
                });
            });

            describe("Where", () => {
                test("Insert raw statement: Where", async () => {
                    const result = await new Query()
                        .from('my_table')
                        .where('test_id', '=', 5)
                        .where(Query.raw("nationality LIKE %alien%"))
                        .toSql()
                        .get();

                    const expectedResult = "SELECT * FROM `my_table` WHERE `test_id` = 5 AND nationality LIKE %alien%";

                    expect(result).toBe(expectedResult);
                });

                test("Insert raw statement: OrWhere", async () => {
                    const result = await new Query()
                        .from('my_table')
                        .where('test_id', '=', 5)
                        .orWhere(Query.raw("nationality LIKE %alien%"))
                        .toSql()
                        .get();

                    const expectedResult = "SELECT * FROM `my_table` WHERE `test_id` = 5 OR nationality LIKE %alien%";

                    expect(result).toBe(expectedResult);
                });
            });

            describe("Having", () => {
                test("Insert raw statement: Having", async () => {
                    const result = await new Query()
                        .from('my_table')
                        .having('test_id', 5)
                        .having(Query.raw('SUM(orders) > 100'))
                        .toSql()
                        .get();

                    expect(result).toBe("SELECT * FROM `my_table` HAVING `test_id` = 5 AND SUM(orders) > 100");
                });

                test("Insert raw statement: OrHaving", async () => {
                    const result = await new Query()
                        .from('my_table')
                        .having('test_id', 5)
                        .orHaving(Query.raw('SUM(orders) > 100'))
                        .toSql()
                        .get();

                    expect(result).toBe("SELECT * FROM `my_table` HAVING `test_id` = 5 OR SUM(orders) > 100");
                });
            });

            describe("OrderBy", () => {
                test("Insert raw statement: OrderBy", async () => {
                    const result = await new Query()
                        .from('my_table')
                        .orderBy('test_id')
                        .orderBy(Query.raw("length(name)"))
                        .orderBy('date')
                        .toSql()
                        .get();

                    const expectedResult = "SELECT * FROM `my_table` ORDER BY `test_id` ASC, length(name) ASC, `date` ASC";

                    expect(result).toBe(expectedResult);
                });

                test("Insert raw statement: OrderByDesc", async () => {
                    const result = await new Query()
                        .from('my_table')
                        .orderBy('test_id')
                        .orderByDesc(Query.raw("length(name)"))
                        .orderBy('date')
                        .toSql()
                        .get();

                    const expectedResult = "SELECT * FROM `my_table` ORDER BY `test_id` ASC, length(name) DESC, `date` ASC";

                    expect(result).toBe(expectedResult);
                });
            });

            describe("GroupBy", () => {
                test("Insert raw statement: GroupBy", async () => {
                    const result = await new Query()
                        .from('my_table')
                        .groupBy('name', Query.raw("DATE(created_at)"), 'order_id')
                        .toSql()
                        .get();

                    expect(result).toBe("SELECT * FROM `my_table` GROUP BY `name`, DATE(created_at), `order_id`");
                });
            })
        });

        describe("Delete", () => {
            test("Builds full delete query string", async () => {
                const result = await Query
                    .toSql()
                    .from('users')
                    .orderBy('name', "ASC")
                    .where('name', '=', 'john')
                    .limit(1)
                    .offset(1)
                    .delete();

                expect(result).toBe("DELETE FROM users WHERE `name` = 'john' ORDER BY `name` ASC LIMIT 1");
            })
        });
    });

    describe("Utility Functions", () => {
        describe("Clone", () => {
            let query;
            const queryResult = "SELECT `id`, `name`, `classes` FROM `my_table` LEFT JOIN `comments` ON `my_table`.`id` = `comments`.`my_table_id` WHERE `name` = 'John' GROUP BY `class` HAVING `classes` > 10 ORDER BY `id` ASC LIMIT 2 OFFSET 5";

            beforeEach(() => {
                query = Query
                    .from('my_table')
                    .where('name', '=', 'John')
                    .select('id', 'name', 'classes')
                    .limit(2)
                    .groupBy('class')
                    .offset(5)
                    .leftJoin('comments', 'my_table.id', '=', 'comments.my_table_id')
                    .orderBy('id')
                    .having('classes', '>', 10);
            });

            test("Clone: It Can deeply clone a query object", async () => {
                const queryClone = query.clone();
                const queryCloneResult = await queryClone.toSql().get();
                const originalQueryResult = await query.toSql().get();

                expect(originalQueryResult).toEqual(queryResult);
                expect(originalQueryResult).toEqual(queryCloneResult);
            });

            test("Clone: It does not use a reference to any internal attribute objects", async () => {
                const queryClone = query.clone();

                query.where('John', 'Pork');

                const queryCloneResult = await queryClone.toSql().get();
                const originalQueryResult = await query.toSql().get();

                const result = "SELECT `id`, `name`, `classes` FROM `my_table` LEFT JOIN `comments` ON `my_table`.`id` = `comments`.`my_table_id` WHERE `name` = 'John' AND `John` = 'Pork' GROUP BY `class` HAVING `classes` > 10 ORDER BY `id` ASC LIMIT 2 OFFSET 5";

                expect(originalQueryResult).toEqual(result);
                expect(originalQueryResult).not.toEqual(queryCloneResult);
            });

            test("Clone Without: excludes attributes when cloned", async () => {
                const queryClone = query.cloneWithout('select', 'where', 'having');

                const queryCloneResult = await queryClone.toSql().get();
                const originalQueryResult = await query.toSql().get();

                const expectedCloneResult = "SELECT * FROM `my_table` LEFT JOIN `comments` ON `my_table`.`id` = `comments`.`my_table_id` GROUP BY `class` ORDER BY `id` ASC LIMIT 2 OFFSET 5";

                expect(originalQueryResult).toEqual(queryResult);
                expect(queryCloneResult).toEqual(expectedCloneResult);
            });
        });
    });

    describe("Validation", () => {
        describe("Comparison Operators", () => {
            const operators = [
                [null, false],
                [1, false],
                [[], false],
                [{}, false],
                ["o", false],
                ["taco", false],
                ["!", false],
                ["===", false],
                ["==", true],
                ["=", true],
                ["!=", true],
                ["<>", true],
                [">", true],
                ["<", true],
                [">=", true],
                ["<=", true],
                ["!<", true],
                ["!>", true],
            ];

            test.each(operators)('validating that %s is %s', (operator, isValid) => {
                if (!isValid) {
                    expect(() => Query.from("users").join("posts", 'id', operator, 'id')).toThrow(InvalidComparisonOperatorError)
                    expect(() => Query.from("users").where("name", operator, 'John')).toThrow(InvalidComparisonOperatorError)
                    expect(() => Query.from("users").orWhere("name", operator, 'John')).toThrow(InvalidComparisonOperatorError)
                    expect(() => Query.from("users").having("name", operator, 'John')).toThrow(InvalidComparisonOperatorError)
                    expect(() => Query.from("users").orHaving("name", operator, 'John')).toThrow(InvalidComparisonOperatorError)
                    expect(() => Query.from("users").whereColumn("name", operator, 'John')).toThrow(InvalidComparisonOperatorError)
                } else {
                    expect(() => Query.from("users").join("posts", 'id', operator, 'id')).not.toThrow(InvalidComparisonOperatorError)
                    expect(() => Query.from("users").where("name", operator, 'John')).not.toThrow(InvalidComparisonOperatorError)
                    expect(() => Query.from("users").orWhere("name", operator, 'John')).not.toThrow(InvalidComparisonOperatorError)
                    expect(() => Query.from("users").having("name", operator, 'John')).not.toThrow(InvalidComparisonOperatorError)
                    expect(() => Query.from("users").orHaving("name", operator, 'John')).not.toThrow(InvalidComparisonOperatorError)
                    expect(() => Query.from("users").whereColumn("name", operator, 'John')).not.toThrow(InvalidComparisonOperatorError)
                }
            });
        });

        describe("Improper array length", () => {
            const arrays = [
                [[], false],
                [{}, false],
                [["one"], false],
                [["one", "two", "three"], false],
                [null, false],
                ["taco", false],
                [["one", "two"], true],
            ];

            test.each(arrays)('validating that %s is %s', (arrayValues, isValid) => {
                if (!isValid) {
                    expect(() => Query.from("users").whereBetween("name", arrayValues)).toThrow(InvalidBetweenValueArrayLength)
                    expect(() => Query.from("users").orWhereBetween("name", arrayValues)).toThrow(InvalidBetweenValueArrayLength)
                    expect(() => Query.from("users").whereNotBetween("name", arrayValues)).toThrow(InvalidBetweenValueArrayLength)
                    expect(() => Query.from("users").orWhereNotBetween("name", arrayValues)).toThrow(InvalidBetweenValueArrayLength)
                    expect(() => Query.from("users").whereBetweenColumns("name", arrayValues)).toThrow(InvalidBetweenValueArrayLength)
                    expect(() => Query.from("users").orWhereBetweenColumns("name", arrayValues)).toThrow(InvalidBetweenValueArrayLength)
                    expect(() => Query.from("users").whereNotBetweenColumns("name", arrayValues)).toThrow(InvalidBetweenValueArrayLength)
                    expect(() => Query.from("users").orWhereNotBetweenColumns("name", arrayValues)).toThrow(InvalidBetweenValueArrayLength)
                    expect(() => Query.from("users").havingBetween("name", arrayValues)).toThrow(InvalidBetweenValueArrayLength)
                    expect(() => Query.from("users").orHavingBetween("name", arrayValues)).toThrow(InvalidBetweenValueArrayLength)
                } else {
                    expect(() => Query.from("users").whereBetween("name", arrayValues)).not.toThrow(InvalidBetweenValueArrayLength)
                    expect(() => Query.from("users").orWhereBetween("name", arrayValues)).not.toThrow(InvalidBetweenValueArrayLength)
                    expect(() => Query.from("users").whereNotBetween("name", arrayValues)).not.toThrow(InvalidBetweenValueArrayLength)
                    expect(() => Query.from("users").orWhereNotBetween("name", arrayValues)).not.toThrow(InvalidBetweenValueArrayLength)
                    expect(() => Query.from("users").whereBetweenColumns("name", arrayValues)).not.toThrow(InvalidBetweenValueArrayLength)
                    expect(() => Query.from("users").orWhereBetweenColumns("name", arrayValues)).not.toThrow(InvalidBetweenValueArrayLength)
                    expect(() => Query.from("users").whereNotBetweenColumns("name", arrayValues)).not.toThrow(InvalidBetweenValueArrayLength)
                    expect(() => Query.from("users").orWhereNotBetweenColumns("name", arrayValues)).not.toThrow(InvalidBetweenValueArrayLength)
                    expect(() => Query.from("users").havingBetween("name", arrayValues)).not.toThrow(InvalidBetweenValueArrayLength)
                    expect(() => Query.from("users").orHavingBetween("name", arrayValues)).not.toThrow(InvalidBetweenValueArrayLength)
                }
            });
        })
    });

    describe("Execute Queries", () => {
        beforeEach(() => {
            DB.prototype.insert.mockClear();
            DB.prototype.all.mockClear();
            DB.prototype.get.mockClear();
            DB.prototype.updateOrDelete.mockClear();
        })

        describe("Insert", () => {
            test("It binds and executes query", async () => {
                DB.prototype.insert.mockResolvedValueOnce(true);

                const table = "users";
                const expectedQuery = "INSERT INTO `users` (name, age, sex) VALUES (?, ?, ?)";
                const expectedBindings = ['John', 20, 'M'];

                const query = await Query
                    .from(table)
                    .insert({
                        'name': 'John',
                        'age': 20,
                        'sex': 'M',
                    });

                expect(query).toEqual(true);
                expect(DB.prototype.insert).toHaveBeenCalledOnce();
                expect(DB.prototype.insert).toHaveBeenCalledWith(expectedQuery, expectedBindings);
            });

            test("InsertGetID: It binds and executes query", async () => {
                DB.prototype.insert.mockResolvedValueOnce(1);

                const table = "users";
                const expectedQuery = "INSERT INTO `users` (name, age, sex) VALUES (?, ?, ?)";
                const expectedBindings = ['John', 20, 'M'];

                const query = await Query
                    .from(table)
                    .insertGetId({
                        'name': 'John',
                        'age': 20,
                        'sex': 'M',
                    });

                expect(query).toEqual(1);
                expect(DB.prototype.insert).toHaveBeenCalledOnce();
                expect(DB.prototype.insert).toHaveBeenCalledWith(expectedQuery, expectedBindings, true);
            })
        });

        describe("Get", () => {
            test("It binds and executes query", async () => {
                const mockGetReturn = [{foo: 'bar'}];
                DB.prototype.all.mockResolvedValueOnce(mockGetReturn);

                const result = await Query
                    .from('my_table')
                    .where('name', '=', 'John')
                    .select('id', 'name')
                    .limit(2)
                    .groupBy('class')
                    .offset(5)
                    .leftJoin('comments', 'my_table.id', '=', 'comments.my_table_id')
                    .orderBy('id')
                    .having('class', 'LIKE', '%example%')
                    .get();

                const preparedQuery = "SELECT `id`, `name` FROM `my_table` LEFT JOIN `comments` ON `my_table`.`id` = `comments`.`my_table_id` WHERE `name` = ? GROUP BY `class` HAVING `class` LIKE ? ORDER BY `id` ASC LIMIT ? OFFSET ?"
                const preparedBindings = ['John', '%example%', 2, 5];

                expect(result).toEqual(mockGetReturn);
                expect(DB.prototype.all).toHaveBeenCalledOnce();
                expect(DB.prototype.all).toHaveBeenCalledWith(preparedQuery, preparedBindings);
            });
        });

        describe("First", () => {
            test("It binds and executes query", async () => {
                const mockGetReturn = {foo: 'bar'};
                DB.prototype.get.mockResolvedValueOnce(mockGetReturn);

                const result = await Query
                    .from('my_table')
                    .where('name', '=', 'John')
                    .select('id', 'name')
                    .groupBy('class')
                    .offset(5)
                    .leftJoin('comments', 'my_table.id', '=', 'comments.my_table_id')
                    .orderBy('id')
                    .having('class', 'LIKE', '%example%')
                    .first();

                const preparedQuery = "SELECT `id`, `name` FROM `my_table` LEFT JOIN `comments` ON `my_table`.`id` = `comments`.`my_table_id` WHERE `name` = ? GROUP BY `class` HAVING `class` LIKE ? ORDER BY `id` ASC LIMIT ? OFFSET ?"
                const preparedBindings = ['John', '%example%', 1, 5];

                expect(result).toEqual(mockGetReturn);
                expect(DB.prototype.get).toHaveBeenCalledOnce();
                expect(DB.prototype.get).toHaveBeenCalledWith(preparedQuery, preparedBindings);
            });
        });

        describe("Update", () => {
            test("It binds and executes query", async () => {
                const mockUpdateReturn = 1;
                DB.prototype.updateOrDelete.mockResolvedValueOnce(mockUpdateReturn);

                const fields = {
                    name: 'john',
                    address: '123 Taco Lane Ave St'
                }

                const result = await Query
                    .from('users')
                    .where('id', '=', 5)
                    .limit(5)
                    .offset(5)
                    .orderBy('name')
                    .update(fields);

                const preparedQuery = "UPDATE `users` SET name = ?, address = ? WHERE `id` = ? ORDER BY `name` ASC LIMIT ?";
                const preparedBindings = ['john', '123 Taco Lane Ave St', 5, 5]

                expect(result).toEqual(mockUpdateReturn);
                expect(DB.prototype.updateOrDelete).toHaveBeenCalledOnce();
                expect(DB.prototype.updateOrDelete).toHaveBeenCalledWith(preparedQuery, preparedBindings);
            })
        });

        describe("Delete", () => {
            test("It binds and executes query", async () => {
                const mockDeleteReturn = 1;
                DB.prototype.updateOrDelete.mockResolvedValueOnce(mockDeleteReturn);

                const result = await Query
                    .from('users')
                    .where('id', '=', 5)
                    .limit(5)
                    .offset(5)
                    .orderBy('name')
                    .delete();

                const preparedQuery = "DELETE FROM `users` WHERE `id` = ? ORDER BY `name` ASC LIMIT ?";
                const preparedBindings = [5, 5]

                expect(result).toEqual(mockDeleteReturn);
                expect(DB.prototype.updateOrDelete).toHaveBeenCalledOnce();
                expect(DB.prototype.updateOrDelete).toHaveBeenCalledWith(preparedQuery, preparedBindings);
            })
        });

        describe("Aggregates", () => {
            describe("Count", () => {
                test("It builds query and executes without specified column", async () => {
                    const mockReturnValue = [{aggregate: 1}]
                    DB.prototype.all.mockResolvedValueOnce(mockReturnValue);

                    const expectedQuery = "SELECT COUNT(*) AS aggregate FROM (SELECT * FROM `users` WHERE `id` > ?) AS temp_table";
                    const expectedBindings = [20];

                    const result = await Query
                        .from('users')
                        .where('id', '>', 20)
                        .count();

                    expect(result).toEqual(1);
                    expect(DB.prototype.all).toHaveBeenCalledOnce();
                    expect(DB.prototype.all).toHaveBeenCalledWith(expectedQuery, expectedBindings);
                });

                test("It builds query and executes with specified column", async () => {
                    const mockReturnValue = [{aggregate: 1}]
                    DB.prototype.all.mockResolvedValueOnce(mockReturnValue);

                    const expectedQuery = "SELECT COUNT(temp_table.`id`) AS aggregate FROM (SELECT * FROM `users` WHERE `id` > ?) AS temp_table";
                    const expectedBindings = [20];

                    const result = await Query
                        .from('users')
                        .where('id', '>', 20)
                        .count('id');

                    expect(result).toEqual(1);
                    expect(DB.prototype.all).toHaveBeenCalledOnce();
                    expect(DB.prototype.all).toHaveBeenCalledWith(expectedQuery, expectedBindings);
                });
            });

            describe("Sum", () => {
                test("It throws without specified column", async () => {
                    await expect(
                        async () => await Query
                            .from('users')
                            .where('id', '>', 20)
                            .sum()
                    ).rejects.toThrow(MissingRequiredArgument);

                    expect(DB.prototype.all).not.toHaveBeenCalled()
                });

                test("It builds query and executes with specified column", async () => {
                    const mockReturnValue = [{aggregate: 420}]
                    DB.prototype.all.mockResolvedValueOnce(mockReturnValue);

                    const expectedQuery = "SELECT SUM(temp_table.`purchase_count`) AS aggregate FROM (SELECT * FROM `users` WHERE `id` > ?) AS temp_table";
                    const expectedBindings = [20];

                    const result = await Query
                        .from('users')
                        .where('id', '>', 20)
                        .sum('purchase_count');

                    expect(result).toEqual(420);
                    expect(DB.prototype.all).toHaveBeenCalledOnce();
                    expect(DB.prototype.all).toHaveBeenCalledWith(expectedQuery, expectedBindings);
                });
            });

            describe("Average", () => {
                test("It throws without specified column", async () => {
                    await expect(
                        async () => await Query
                            .from('users')
                            .where('id', '>', 20)
                            .avg()
                    ).rejects.toThrow(MissingRequiredArgument);

                    expect(DB.prototype.all).not.toHaveBeenCalled()
                });

                test("Avg: It builds query and executes with specified column", async () => {
                    const mockReturnValue = [{aggregate: 1.67}]
                    DB.prototype.all.mockResolvedValueOnce(mockReturnValue);

                    const expectedQuery = "SELECT AVG(temp_table.`purchase_count`) AS aggregate FROM (SELECT * FROM `users` WHERE `id` > ?) AS temp_table";
                    const expectedBindings = [20];

                    const result = await Query
                        .from('users')
                        .where('id', '>', 20)
                        .avg('purchase_count');

                    expect(result).toEqual(1.67);
                    expect(DB.prototype.all).toHaveBeenCalledOnce();
                    expect(DB.prototype.all).toHaveBeenCalledWith(expectedQuery, expectedBindings);
                });

                test("Average: It builds query and executes with specified column", async () => {
                    const mockReturnValue = [{aggregate: 1.67}]
                    DB.prototype.all.mockResolvedValueOnce(mockReturnValue);

                    const expectedQuery = "SELECT AVG(temp_table.`purchase_count`) AS aggregate FROM (SELECT * FROM `users` WHERE `id` > ?) AS temp_table";
                    const expectedBindings = [20];

                    const result = await Query
                        .from('users')
                        .where('id', '>', 20)
                        .average('purchase_count');

                    expect(result).toEqual(1.67);
                    expect(DB.prototype.all).toHaveBeenCalledOnce();
                    expect(DB.prototype.all).toHaveBeenCalledWith(expectedQuery, expectedBindings);
                });
            });

            describe("Min", () => {
                test("It throws without specified column", async () => {
                    await expect(
                        async () => await Query
                            .from('users')
                            .where('id', '>', 20)
                            .min()
                    ).rejects.toThrow(MissingRequiredArgument);

                    expect(DB.prototype.all).not.toHaveBeenCalled()
                });

                test("It builds query and executes with specified column", async () => {
                    const mockReturnValue = [{aggregate: 2}]
                    DB.prototype.all.mockResolvedValueOnce(mockReturnValue);

                    const expectedQuery = "SELECT MIN(temp_table.`purchase_count`) AS aggregate FROM (SELECT * FROM `users` WHERE `id` > ?) AS temp_table";
                    const expectedBindings = [20];

                    const result = await Query
                        .from('users')
                        .where('id', '>', 20)
                        .min('purchase_count');

                    expect(result).toEqual(2);
                    expect(DB.prototype.all).toHaveBeenCalledOnce();
                    expect(DB.prototype.all).toHaveBeenCalledWith(expectedQuery, expectedBindings);
                });
            });

            describe("Max", () => {
                test("It throws without specified column", async () => {
                    await expect(
                        async () => await Query
                            .from('users')
                            .where('id', '>', 20)
                            .max()
                    ).rejects.toThrow(MissingRequiredArgument);

                    expect(DB.prototype.all).not.toHaveBeenCalled()
                });

                test("It builds query and executes with specified column", async () => {
                    const mockReturnValue = [{aggregate: 1337}]
                    DB.prototype.all.mockResolvedValueOnce(mockReturnValue);

                    const expectedQuery = "SELECT MAX(temp_table.`purchase_count`) AS aggregate FROM (SELECT * FROM `users` WHERE `id` > ?) AS temp_table";
                    const expectedBindings = [20];

                    const result = await Query
                        .from('users')
                        .where('id', '>', 20)
                        .max('purchase_count');

                    expect(result).toEqual(1337);
                    expect(DB.prototype.all).toHaveBeenCalledOnce();
                    expect(DB.prototype.all).toHaveBeenCalledWith(expectedQuery, expectedBindings);
                });
            });
        });
    });
});