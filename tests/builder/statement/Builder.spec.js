import {beforeEach, describe, expect, test} from 'vitest';
import Where from "../../../src/builder/statement/where/Where.js";
import Builder from "../../../src/builder/statement/Builder.js";
import {STATEMENTS} from "../../../src/builder/statement/Base.js";
import OrWhere from "../../../src/builder/statement/where/OrWhere.js";
import Select from "../../../src/builder/statement/select/Select.js";
import WhereNull from "../../../src/builder/statement/where/WhereNull.js";
import OrWhereNull from "../../../src/builder/statement/where/OrWhereNull.js";
import WhereNotNull from "../../../src/builder/statement/where/WhereNotNull.js";
import Group from "../../../src/builder/statement/Group.js";
import WhereBetween from "../../../src/builder/statement/where/WhereBetween.js";
import InnerJoin from "../../../src/builder/statement/join/InnerJoin.js";
import LeftJoin from "../../../src/builder/statement/join/LeftJoin.js";
import CrossJoin from "../../../src/builder/statement/join/CrossJoin.js";
import SelectRaw from "../../../src/builder/statement/select/SelectRaw.js";
import Having from "../../../src/builder/statement/having/Having.js";
import OrHaving from "../../../src/builder/statement/having/OrHaving.js";
import HavingRaw from "../../../src/builder/statement/having/HavingRaw.js";
import OrHavingRaw from "../../../src/builder/statement/having/OrHavingRaw.js";
import GroupBy from "../../../src/builder/statement/group/GroupBy.js";
import GroupByRaw from "../../../src/builder/statement/group/GroupByRaw.js";
import OrderBy from "../../../src/builder/statement/order/OrderBy.js";
import OrderByDesc from "../../../src/builder/statement/order/OrderByDesc.js";
import WhereAny from "../../../src/builder/statement/where/WhereAny.js";
import Limit from "../../../src/builder/statement/limit/Limit.js";
import Offset from "../../../src/builder/statement/offset/Offset.js";

describe('Statement: Statement Builder', () => {
    describe("Select", () => {
        describe("toString", () => {
            test("it builds complete 'SELECT' statement string", () => {
                const selectStatementOne = new Select('name');
                const selectStatementTwo = new Select('age');
                const selectStatementThree = new Select('sex');
                const expectedResult = "SELECT `name`, `age`, `sex`";

                const builder = new Builder(STATEMENTS.select);
                builder.push(selectStatementOne).push(selectStatementTwo).push(selectStatementThree);

                const result = builder.toString();

                expect(result).toEqual(expectedResult);
            });

            test("it builds complete 'SELECT DISTINCT' statement string", () => {
                const selectStatementOne = new Select('name');
                const selectStatementTwo = new Select('age');
                const selectStatementThree = new Select('sex');
                const expectedResult = "SELECT DISTINCT `name`, `age`, `sex`";

                const builder = new Builder(STATEMENTS.select);
                builder.push(selectStatementOne).push(selectStatementTwo).push(selectStatementThree).setDistinct();

                const result = builder.toString();

                expect(result).toEqual(expectedResult);
            });

            test("it does not add 'DISTINCT' to 'SELECT' when using default '*' ", () => {
                const expectedResult = "SELECT *";

                const builder = new Builder(STATEMENTS.select);
                builder.setDistinct();

                const result = builder.toString();

                expect(result).toEqual(expectedResult);
            });

            test("it defaults to '*' when no select columns provided", () => {
                const expectedResult = "SELECT *";

                const builder = new Builder(STATEMENTS.select);

                const result = builder.toString();

                expect(result).toEqual(expectedResult);
            });

            test("it can build select statement with different select types", () => {
                const selectStatementOne = new Select('name');
                const selectStatementTwo = new Select('age');
                const selectStatementThree = new Select('sex');
                const rawStatement = new SelectRaw('price * ? as price_with_tax', [1.0825]);
                const expectedResult = "SELECT `name`, `age`, `sex`, price * 1.0825 as price_with_tax";

                const builder = new Builder(STATEMENTS.select);
                builder.push(selectStatementOne).push(selectStatementTwo).push(selectStatementThree).push(rawStatement);

                const result = builder.toString();

                expect(result).toEqual(expectedResult);
            });
        });

        describe("prepare", () => {
            test("it builds complete prepareObject", () => {
                const selectStatementOne = new Select('name');
                const selectStatementTwo = new Select('age');
                const selectStatementThree = new Select('sex');
                const expectedResult = "SELECT `name`, `age`, `sex`";

                const builder = new Builder(STATEMENTS.select);
                builder.push(selectStatementOne).push(selectStatementTwo).push(selectStatementThree);

                const result = builder.prepare();

                expect(result.query).toEqual(expectedResult);
                expect(result.bindings).toEqual([]);
            });

            test("it builds complete statement prepare object string with distinct", () => {
                const selectStatementOne = new Select('name');
                const selectStatementTwo = new Select('age');
                const selectStatementThree = new Select('sex');
                const expectedResult = "SELECT DISTINCT `name`, `age`, `sex`";

                const builder = new Builder(STATEMENTS.select);
                builder.push(selectStatementOne).push(selectStatementTwo).push(selectStatementThree).setDistinct();

                const result = builder.prepare();

                expect(result.query).toEqual(expectedResult);
                expect(result.bindings).toEqual([]);
            });

            test("it defaults to '*' when no select columns provided", () => {
                const expectedResult = "SELECT *";

                const builder = new Builder(STATEMENTS.select);

                const result = builder.prepare();

                expect(result.query).toEqual(expectedResult);
                expect(result.bindings).toEqual([]);
            });

            test("it can build select prepare object with different select types", () => {
                const selectStatementOne = new Select('name');
                const selectStatementTwo = new Select('age');
                const selectStatementThree = new Select('sex');
                const rawSelectStatement = new SelectRaw('price * ? as price_with_tax', [1.0825]);
                const expectedResult = "SELECT `name`, `age`, `sex`, price * ? as price_with_tax";
                const expectedBindings = [1.0825];

                const builder = new Builder(STATEMENTS.select);
                builder.push(selectStatementOne).push(selectStatementTwo).push(selectStatementThree).push(rawSelectStatement);

                const result = builder.prepare();

                expect(result.query).toEqual(expectedResult);
                expect(result.bindings).toEqual(expectedBindings);
            });
        });
    });

    describe("Join", () => {
        describe("All joins", () => {
            test("Can combine all joins together", () => {
                const innerJoin = new InnerJoin('posts', 'users.id', '=', 'posts.user_id');
                const leftJoin = new LeftJoin('comments', 'users.id', '=', 'comments.user_id');
                const crossJoin = new CrossJoin('likes');
                const expectedResult = "INNER JOIN `posts` ON `users`.`id` = `posts`.`user_id` LEFT JOIN `comments` ON `users`.`id` = `comments`.`user_id` CROSS JOIN `likes`";

                const builder = new Builder(STATEMENTS.join);
                builder.push(innerJoin).push(leftJoin).push(crossJoin);

                const result = builder.toString();

                expect(result).toEqual(expectedResult);
            });
        });

        describe("Inner Join", () => {
            describe("toString", () => {
                test("It builds complete statement string", () => {
                    const firstJoin = new InnerJoin('posts', 'users.id', '=', 'posts.user_id');
                    const secondJoin = new InnerJoin('comments', 'users.id', '=', 'comments.user_id');
                    const expectedResult = "INNER JOIN `posts` ON `users`.`id` = `posts`.`user_id` INNER JOIN `comments` ON `users`.`id` = `comments`.`user_id`";

                    const builder = new Builder(STATEMENTS.join);
                    builder.push(firstJoin).push(secondJoin);

                    const result = builder.toString();

                    expect(result).toEqual(expectedResult);
                });

                test("It builds complete statement string and ignores argument passed to 'toString'", () => {
                    const firstJoin = new InnerJoin('posts', 'users.id', '=', 'posts.user_id');
                    const secondJoin = new InnerJoin('comments', 'users.id', '=', 'comments.user_id');
                    const expectedResult = "INNER JOIN `posts` ON `users`.`id` = `posts`.`user_id` INNER JOIN `comments` ON `users`.`id` = `comments`.`user_id`";

                    const builder = new Builder(STATEMENTS.join);
                    builder.push(firstJoin).push(secondJoin);

                    const result = builder.toString(true);

                    expect(result).toEqual(expectedResult);
                });
            });
        });

        describe("Left Join", () => {
            describe("toString", () => {
                test("It builds complete statement string", () => {
                    const firstJoin = new LeftJoin('posts', 'users.id', '=', 'posts.user_id');
                    const secondJoin = new LeftJoin('comments', 'users.id', '=', 'comments.user_id');
                    const expectedResult = "LEFT JOIN `posts` ON `users`.`id` = `posts`.`user_id` LEFT JOIN `comments` ON `users`.`id` = `comments`.`user_id`";

                    const builder = new Builder(STATEMENTS.join);
                    builder.push(firstJoin).push(secondJoin);

                    const result = builder.toString();

                    expect(result).toEqual(expectedResult);
                });

                test("It builds complete statement string and ignores argument passed to 'toString'", () => {
                    const firstJoin = new LeftJoin('posts', 'users.id', '=', 'posts.user_id');
                    const secondJoin = new LeftJoin('comments', 'users.id', '=', 'comments.user_id');
                    const expectedResult = "LEFT JOIN `posts` ON `users`.`id` = `posts`.`user_id` LEFT JOIN `comments` ON `users`.`id` = `comments`.`user_id`";

                    const builder = new Builder(STATEMENTS.join);
                    builder.push(firstJoin).push(secondJoin);

                    const result = builder.toString(true);

                    expect(result).toEqual(expectedResult);
                });
            });
        });

        describe("Cross Join", () => {
            describe("toString", () => {
                test("It builds complete statement string", () => {
                    const firstJoin = new CrossJoin('posts');
                    const secondJoin = new CrossJoin('comments');
                    const expectedResult = "CROSS JOIN `posts` CROSS JOIN `comments`";

                    const builder = new Builder(STATEMENTS.join);
                    builder.push(firstJoin).push(secondJoin);

                    const result = builder.toString();

                    expect(result).toEqual(expectedResult);
                });

                test("It builds complete statement string and ignores argument passed to 'toString'", () => {
                    const firstJoin = new CrossJoin('posts');
                    const secondJoin = new CrossJoin('comments');
                    const expectedResult = "CROSS JOIN `posts` CROSS JOIN `comments`";

                    const builder = new Builder(STATEMENTS.join);
                    builder.push(firstJoin).push(secondJoin);

                    const result = builder.toString(true);

                    expect(result).toEqual(expectedResult);
                });
            });
        });
    });

    describe("Where", () => {
        describe("toString", () => {
            test("It builds complete statement string", () => {
                const first = new Where('name', '=', 'John');
                const second = new OrWhere('age', '>', 20);
                const third = new WhereNull('sex');
                const fourth = new OrWhereNull('taco');
                const fifth = new WhereNotNull('mouse');
                const sixth = new WhereAny([
                    'name',
                    'email',
                    'phone',
                ], 'LIKE', 'Example%');

                const expectedResult = [
                    "WHERE `name` = 'John'",
                    "OR `age` > 20",
                    "AND `sex` IS NULL",
                    "OR `taco` IS NULL",
                    "AND `mouse` IS NOT NULL",
                    "AND (`name` LIKE 'Example%' OR `email` LIKE 'Example%' OR `phone` LIKE 'Example%')"
                ];

                const builder = new Builder(STATEMENTS.where);
                builder.push(first).push(second).push(third).push(fourth).push(fifth).push(sixth);

                const result = builder.toString();

                expect(result).toEqual(expectedResult.join(" "));
            });

            test("It returns an empty string if there are no statements", () => {
                const builder = new Builder(STATEMENTS.where);

                const result = builder.toString();

                expect(result).toEqual('');
            });
        });

        describe("Prepare", () => {
            test("it builds the prepare object with correct values", () => {
                const first = new Where('name', '=', 'John');
                const second = new OrWhere('age', '>', 20);
                const third = new WhereNull('sex');
                const fourth = new OrWhereNull('taco');
                const fifth = new WhereNotNull('mouse');

                const expectedQuery = "WHERE `name` = ? OR `age` > ? AND `sex` IS NULL OR `taco` IS NULL AND `mouse` IS NOT NULL"
                const expectedBindings = ['John', 20]

                const builder = new Builder(STATEMENTS.where);
                builder.push(first).push(second).push(third).push(fourth).push(fifth);

                const result = builder.prepare();

                expect(result.query).toEqual(expectedQuery);
                expect(result.bindings).toEqual(expectedBindings);
            });

            test("it builds an empty prepare object when no statements provided", () => {
                const builder = new Builder(STATEMENTS.where);

                const result = builder.prepare();

                expect(result.query).toEqual('');
                expect(result.bindings).toEqual([]);
            });
        });
    });

    describe("Grouping queries", () => {
        describe("toString", () => {
            test("it can group queries with 'AND'", () => {
                const first = new Where('name', '=', 'John');
                const second = new OrWhere('age', '>', 20);
                const third = new WhereNull('sex');
                const fourth = new OrWhereNull('taco');
                const fifth = new WhereNotNull('mouse');

                const expectedResult = "WHERE `name` = 'John' AND (`age` > 20 AND `sex` IS NULL) OR `taco` IS NULL AND `mouse` IS NOT NULL"

                const builder = new Builder(STATEMENTS.where);
                const group = new Group();
                builder.push(first)

                group.push(second).push(third);
                builder.push(group);

                builder.push(fourth).push(fifth);

                const result = builder.toString();

                expect(result).toEqual(expectedResult);
            });

            test("it can group queries with 'OR'", () => {
                const first = new Where('name', '=', 'John');
                const second = new OrWhere('age', '>', 20);
                const third = new WhereNull('sex');
                const fourth = new OrWhereNull('taco');
                const fifth = new WhereNotNull('mouse');

                const expectedResult = "WHERE `name` = 'John' OR (`age` > 20 AND `sex` IS NULL) OR `taco` IS NULL AND `mouse` IS NOT NULL"

                const builder = new Builder(STATEMENTS.where);
                const group = new Group('OR');
                builder.push(first)

                group.push(second).push(third);
                builder.push(group);

                builder.push(fourth).push(fifth);

                const result = builder.toString();

                expect(result).toEqual(expectedResult);
            });

            test("it omits the group if no queries exist within it", () => {
                const first = new Where('name', '=', 'John');
                const fourth = new OrWhereNull('taco');
                const fifth = new WhereNotNull('mouse');

                const expectedResult = "WHERE `name` = 'John' OR `taco` IS NULL AND `mouse` IS NOT NULL"

                const builder = new Builder(STATEMENTS.where);
                const group = new Group();

                builder.push(first)
                builder.push(group);
                builder.push(fourth).push(fifth);

                const result = builder.toString();

                expect(result).toEqual(expectedResult);
            });

            test("it does not add the condition to the group when the group partial statement is the first", () => {
                const first = new Where('name', '=', 'John');
                const second = new OrWhere('age', '>', 20);
                const third = new WhereNull('sex');
                const fourth = new OrWhereNull('taco');
                const fifth = new WhereNotNull('mouse');

                const expectedResult = "WHERE (`name` = 'John' OR `age` > 20 AND `sex` IS NULL) OR `taco` IS NULL AND `mouse` IS NOT NULL"

                const builder = new Builder(STATEMENTS.where);
                const group = new Group();

                group.push(first).push(second).push(third);
                builder.push(group);

                builder.push(fourth).push(fifth);

                const result = builder.toString();

                expect(result).toEqual(expectedResult);
            });
        });

        describe("Prepare", () => {
            test("it can prepare group queries", () => {
                const first = new Where('name', '=', 'John');
                const second = new OrWhere('age', '>', 20);
                const third = new Where('role', '=', 'admin');
                const fourth = new OrWhereNull('taco');
                const fifth = new WhereBetween('hours', [20, 40]);

                const expectedBindings = ['John', 20, 'admin', 20, 40];
                const expectedQuery = "WHERE `name` = ? AND (`age` > ? AND `role` = ?) OR `taco` IS NULL AND `hours` BETWEEN ? AND ?"

                const builder = new Builder(STATEMENTS.where);
                const group = new Group();
                builder.push(first)

                group.push(second).push(third);
                builder.push(group);

                builder.push(fourth).push(fifth);

                const result = builder.prepare();

                expect(result.query).toEqual(expectedQuery);
                expect(result.bindings).toEqual(expectedBindings);
            });
        })
    });

    describe("Having", () => {
        describe("toString", () => {
            test("It builds complete statement string", () => {
                const first = new Having('name', '=', 'John');
                const second = new OrHavingRaw('team LIKE ?', ['Nippon%']);
                const third = new OrHaving('role', '=', 'HR');
                const fourth = new HavingRaw('SUM(price) > ?', [2500])

                const expectedResult = "HAVING `name` = 'John' OR team LIKE 'Nippon%' OR `role` = 'HR' AND SUM(price) > 2500"

                const builder = new Builder(STATEMENTS.having);
                builder.push(first).push(second).push(third).push(fourth);

                const result = builder.toString();

                expect(result).toEqual(expectedResult);
            });

            test("It returns an empty string if there are no statements", () => {
                const builder = new Builder(STATEMENTS.having);

                const result = builder.toString();

                expect(result).toEqual('');
            });
        });

        describe("Prepare", () => {
            test("it builds the prepare object with correct values", () => {
                const first = new Having('name', '=', 'John');
                const second = new OrHavingRaw('team LIKE ?', ['Nippon%']);
                const third = new OrHaving('role', '=', 'HR');
                const fourth = new HavingRaw('SUM(price) > ?', [2500])

                const expectedQuery = "HAVING `name` = ? OR team LIKE ? OR `role` = ? AND SUM(price) > ?"
                const expectedBindings = ['John', 'Nippon%', 'HR', 2500]

                const builder = new Builder(STATEMENTS.having);
                builder.push(first).push(second).push(third).push(fourth);

                const result = builder.prepare();

                expect(result.query).toEqual(expectedQuery);
                expect(result.bindings).toEqual(expectedBindings);
            });

            test("it builds an empty prepare object when no statements provided", () => {
                const builder = new Builder(STATEMENTS.having);

                const result = builder.prepare();

                expect(result.query).toEqual('');
                expect(result.bindings).toEqual([]);
            });
        });
    })

    describe("OrderBy", () => {
        describe("toString", () => {
            test('it builds complete statement string', () => {
                const orderByStatement = new OrderBy('name');
                const orderByStatementTwo = new OrderBy('role', "DESC");
                const orderByDesc = new OrderByDesc('address');
                const expectedResult = "ORDER BY `name` ASC, `role` DESC, `address` DESC";

                const builder = new Builder(STATEMENTS.orderBy);
                builder.push(orderByStatement).push(orderByStatementTwo).push(orderByDesc);

                const result = builder.toString();

                expect(result).toEqual(expectedResult);
            });
        });

        describe("prepare", () => {
            test('it builds complete statement prepare object', () => {
                const orderByStatement = new OrderBy('name');
                const orderByStatementTwo = new OrderBy('role', "DESC");
                const expectedResult = "ORDER BY `name` ASC, `role` DESC";

                const builder = new Builder(STATEMENTS.orderBy);
                builder.push(orderByStatement).push(orderByStatementTwo);

                const result = builder.prepare();

                expect(result.query).toEqual(expectedResult);
                expect(result.bindings).toEqual([]);
            });
        });
    });

    describe("Group", () => {
        describe("toString", () => {
            test('it builds complete statement string', () => {
                const selectStatementOne = new GroupBy('name');
                const selectStatementTwo = new GroupBy('age');
                const selectStatementThree = new GroupBy('sex');
                const expectedResult = "GROUP BY `name`, `age`, `sex`";

                const builder = new Builder(STATEMENTS.group);
                builder.push(selectStatementOne).push(selectStatementTwo).push(selectStatementThree);

                const result = builder.toString();

                expect(result).toEqual(expectedResult);
            });

            test("push: appends select statement if it exists", () => {
                const firstGroupStatement = new GroupBy('name');
                const secondGroupStatement = new GroupBy('age');
                const thirdGroupStatement = new GroupByRaw('price, desk, id');
                const expectedResult = "GROUP BY `name`, `age`, price, desk, id";

                const builder = new Builder(STATEMENTS.group);
                builder.push(firstGroupStatement).push(secondGroupStatement).push(thirdGroupStatement);

                const result = builder.toString();

                expect(result).toEqual(expectedResult);
            });
        });

        describe("prepare", () => {
            test('it builds complete prepareObject', () => {
                const selectStatement = new GroupBy('name');
                const selectStatementTwo = new GroupBy('age');
                const selectStatementThree = new GroupBy('sex');
                const expectedResult = "GROUP BY `name`, `age`, `sex`";

                const builder = new Builder(STATEMENTS.group);
                builder.push(selectStatement).push(selectStatementTwo).push(selectStatementThree);

                const result = builder.prepare();

                expect(result.query).toEqual(expectedResult);
                expect(result.bindings).toEqual([]);
            });
        });
    });

    describe("Limit", () => {
        describe("toString", () => {
            test("It builds complete string", () => {
                const limitStatement = new Limit(5);
                const expectedQuery = "LIMIT 5";

                const builder = new Builder(STATEMENTS.limit);

                builder.push(limitStatement);

                expect(builder.toString()).toEqual(expectedQuery);
            });

            test("It only pushes a single value, and uses the most recent push", () => {
                const limitOne = new Limit(5);
                const limitTwo = new Limit(10);
                const expectedQuery = "LIMIT 10";

                const builder = new Builder(STATEMENTS.limit);

                builder.push(limitOne).push(limitTwo);

                expect(builder.toString()).toEqual(expectedQuery);
            });
        });

        describe("Prepare", () => {
            test("It builds complete prepare object", () => {
                const limitStatement = new Limit(5);
                const expectedQuery = "LIMIT ?";

                const builder = new Builder(STATEMENTS.limit);

                builder.push(limitStatement);

                const result = builder.prepare();

                expect(result.query).toEqual(expectedQuery);
                expect(result.bindings).toEqual([5]);
            });
        });
    });

    describe("Offset", () => {
        describe("toString", () => {
            test("It builds complete string", () => {
                const offsetStatement = new Offset(5);
                const expectedQuery = "OFFSET 5";

                const builder = new Builder(STATEMENTS.offset);

                builder.push(offsetStatement);

                expect(builder.toString()).toEqual(expectedQuery);
            });

            test("It only pushes a single value, and uses the most recent push", () => {
                const offsetOne = new Offset(5);
                const offsetTwo = new Offset(10);
                const expectedQuery = "OFFSET 10";

                const builder = new Builder(STATEMENTS.offset);

                builder.push(offsetOne).push(offsetTwo);

                expect(builder.toString()).toEqual(expectedQuery);
            });
        });

        describe("Prepare", () => {
            test("It builds complete prepare object", () => {
                const offsetStatement = new Offset(5);
                const expectedQuery = "OFFSET ?";

                const builder = new Builder(STATEMENTS.offset);

                builder.push(offsetStatement);

                const result = builder.prepare();

                expect(result.query).toEqual(expectedQuery);
                expect(result.bindings).toEqual([5]);
            });
        });
    });

    describe("Utility functions", () => {
        describe("Clone", () => {
            let firstStatement;
            let secondStatement;
            let thirdStatement;
            let fourthStatement;
            let fifthStatement;
            let sixthStatement;
            const expectedResult = [
                "WHERE `name` = 'John'",
                "OR `age` > 20",
                "AND `sex` IS NULL",
                "OR `taco` IS NULL",
                "AND `mouse` IS NOT NULL",
                "AND (`name` LIKE 'Example%' OR `email` LIKE 'Example%' OR `phone` LIKE 'Example%')"
            ];

            beforeEach(() => {
                firstStatement = new Where('name', '=', 'John');
                secondStatement = new OrWhere('age', '>', 20);
                thirdStatement = new WhereNull('sex');
                fourthStatement = new OrWhereNull('taco');
                fifthStatement = new WhereNotNull('mouse');
                sixthStatement = new WhereAny([
                    'name',
                    'email',
                    'phone',
                ], 'LIKE', 'Example%');
            });

            test("It clones builder", () => {
                const originalBuilder = new Builder(STATEMENTS.where);

                originalBuilder.push(firstStatement).push(secondStatement).push(thirdStatement)
                    .push(fourthStatement).push(fifthStatement).push(sixthStatement);

                const clonedBuilder = originalBuilder.clone();
                const originalResult = originalBuilder.toString();
                const clonedResult = clonedBuilder.toString();

                expect(originalResult).toEqual(expectedResult.join(" "));
                expect(clonedResult).toEqual(expectedResult.join(" "));
            });
        });

        describe("Is Empty", () => {
            test("Returns true if there are no statements", () => {
                const builder = new Builder(STATEMENTS.where);

                expect(builder.isEmpty()).toEqual(true);
            });

            test("Returns false if there are statements", () => {
                const builder = new Builder(STATEMENTS.where);
                builder.push(new Where('neo', '=', 'simulation'));

                expect(builder.isEmpty()).toEqual(false);
            });
        });
    });
});