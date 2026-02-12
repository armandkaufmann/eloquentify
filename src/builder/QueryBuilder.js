import Builder from "./statement/Builder.js";
import {STATEMENTS} from "./statement/Base.js";
import {Utility} from "../utils/Utility.js";

/**
 * @typedef QueryObject
 * @property {Builder} select
 * @property {Builder} from
 * @property {Builder} join
 * @property {Builder} where
 * @property {Builder} group
 * @property {Builder} having
 * @property {Builder} order
 * @property {Builder} limit
 * @property {Builder} offset
 */

export class QueryBuilder {
    /** @type {QueryObject} */
    #query = {
        select: new Builder(STATEMENTS.select),
        from: new Builder(STATEMENTS.from),
        join: new Builder(STATEMENTS.join),
        where: new Builder(STATEMENTS.where),
        group: new Builder(STATEMENTS.group),
        having: new Builder(STATEMENTS.having),
        order: new Builder(STATEMENTS.orderBy),
        limit: new Builder(STATEMENTS.limit),
        offset: new Builder(STATEMENTS.offset)
    }

    /**
     * @param {Object} attributes
     * @returns void
     */
    _hydrate(attributes) {
        Object.keys(attributes).forEach((key) => {
            this.#query[key] = attributes[key];
        });
    }

    /**
     * @param {?Array<string>} [excludeFromQueryObject=[]]
     * @returns QueryBuilder
     */
    clone(excludeFromQueryObject = []) {
        const queryBuilderClone = new QueryBuilder();
        const clonedState = this.#cloneState(excludeFromQueryObject);

        queryBuilderClone._hydrate(clonedState);

        return queryBuilderClone;
    }

    /**
     * @param {?Array<string>} [excludeFromQueryObject=[]]
     * @returns Object
     */
    #cloneState(excludeFromQueryObject = []) {
        const attributes = {};

        Object.keys(this.#query).forEach((key) => {
            if (excludeFromQueryObject.includes(key)) {
                return;
            }

            attributes[key] = this.#query[key].clone();
        });

        return attributes;
    }

    /**
     * @returns string
     */
    getTable() {
        return this.#query.from.clone().toggleWithStatement(false).toString()
    }

    /**
     * @param {string} statement
     * @param {Base|Raw|Builder} value
     * @returns QueryBuilder
     */
    appendQuery(statement, value) {
        this.#query[statement].push(value);

        return this;
    }

    /**
     * @param {string} statement
     * @returns boolean
     */
    isStatementEmpty(statement) {
        return this.#query[statement].isEmpty();
    }

    /**
     * @returns QueryBuilder
     */
    setDistinctSelect() {
        this.#query.select.setDistinct();

        return this;
    }

    /**
     * @returns string
     */
    buildDeleteSqlString() {
        const queries = [
            this.#buildPartialDeleteSqlQuery(), this.#query.where.toString(),
            this.#query.order.toString(), this.#query.limit.toString(),
        ];

        return this.#joinQueryStrings(queries)
    }

    /**
     * @param {Record<string, any>} fields
     * @returns string
     */
    buildInsertSqlString(fields) {
        let columns = [];
        let values = [];

        for (const [column, value] of Object.entries(fields)) {
            columns.push(column);
            values.push(value);
        }

        return "INSERT INTO " + this.getTable() + " (" + columns.join(', ') +
            ") VALUES (" + Utility.valuesToString(values) + ")";
    }

    /**
     * @returns string
     */
    buildUpdateSqlString(fields) {
        const queries = [
            this.#buildPartialUpdateSqlQuery(fields), this.#query.where.toString(),
            this.#query.order.toString(), this.#query.limit.toString(),
        ];

        return this.#joinQueryStrings(queries)
    }

    /**
     * @param {boolean} [toString=false]
     * @returns PrepareObject|string
     */
    buildSelectSql(toString = false) {
        const queries = Object.keys(this.#query).map((key) => {
            const statement = this.#query[key];
            if (toString) {
                return statement.toString();
            }

            return statement.prepare();
        });

        if (toString) {
            return this.#joinQueryStrings(queries);
        }

        return this.#joinPrepareObjects(queries);
    }

    /**
     * @returns PrepareObject
     */
    buildDeletePrepareObject() {
        const queries = [
            this.#buildPartialDeletePrepareObject(), this.#query.where.prepare(),
            this.#query.order.prepare(), this.#query.limit.prepare(),
        ];

        return this.#joinPrepareObjects(queries)
    }

    /**
     * @returns PrepareObject
     */
    buildUpdatePrepareObject(fields) {
        const queries = [
            this.#buildPartialUpdatePrepareObject(fields), this.#query.where.prepare(),
            this.#query.order.prepare(), this.#query.limit.prepare(),
        ];

        return this.#joinPrepareObjects(queries)
    }

    /**
     * @param {Record<string, any>} fields
     * @returns PrepareObject
     */
    buildInsertPrepareObject(fields) {
        let columns = [];
        let values = [];

        for (const [column, value] of Object.entries(fields)) {
            columns.push(column);
            values.push(value);
        }

        const query = "INSERT INTO " + this.getTable()
            + " (" + columns.join(', ') +
            ") VALUES (" + Array(values.length).fill('?').join(', ') + ")";

        return {
            query,
            bindings: values
        }
    }

    #buildPartialDeleteSqlQuery() {
        return "DELETE FROM " + this.getTable();
    }

    /**
     * @returns string
     */
    #buildPartialUpdateSqlQuery(fields) {
        let pairs = [];

        for (const [column, value] of Object.entries(fields)) {
            pairs.push(`${column} = ${Utility.valuesToString([value])}`)
        }

        return "UPDATE " + this.getTable()
            + " SET " + pairs.join(', ');
    }

    /**
     * @param {Array<string>} queries
     * @returns string
     */
    #joinQueryStrings(queries) {
        return queries
            .reduce((result, queryString, index) => {
                return result += queryString !== "" ? (index > 0 ? ' ' : '') + queryString : ''
            }, "");
    }

    #buildPartialDeletePrepareObject() {
        const query = "DELETE FROM " + this.getTable();

        const bindings = [];

        return {query, bindings};
    }

    /**
     * @returns PrepareObject
     */
    #buildPartialUpdatePrepareObject(fields) {
        let pairs = [];
        let bindings = [];

        for (const [column, value] of Object.entries(fields)) {
            pairs.push(`${column} = ?`);
            bindings.push(value);
        }

        const query = "UPDATE " + this.getTable()
            + " SET " + pairs.join(', ');

        return {
            query, bindings
        };
    }

    /**
     * @param {Array<PrepareObject>} queries
     * @returns PrepareObject
     */
    #joinPrepareObjects(queries) {
        const query = this.#joinQueryStrings(queries.map(query => query.query));

        const bindings = queries.reduce((accumulator, query) => {
            return [...accumulator, ...query.bindings];
        }, []);

        return {query, bindings};
    }
}