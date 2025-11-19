import Where from "../statement/where/Where.js";
import Validation from "../../utils/Validation.js";
import OrWhere from "../statement/where/OrWhere.js";
import WhereNull from "../statement/where/WhereNull.js";
import OrWhereNull from "../statement/where/OrWhereNull.js";
import WhereNotNull from "../statement/where/WhereNotNull.js";
import OrWhereNotNull from "../statement/where/OrWhereNotNull.js";
import WhereIn from "../statement/where/WhereIn.js";
import OrWhereIn from "../statement/where/OrWhereIn.js";
import WhereNotIn from "../statement/where/WhereNotIn.js";
import OrWhereNotIn from "../statement/where/OrWhereNotIn.js";
import WhereBetween from "../statement/where/WhereBetween.js";
import OrWhereBetween from "../statement/where/OrWhereBetween.js";
import WhereNotBetween from "../statement/where/WhereNotBetween.js";
import OrWhereNotBetween from "../statement/where/OrWhereNotBetween.js";
import WhereColumn from "../statement/where/WhereColumn.js";
import OrWhereColumn from "../statement/where/OrWhereColumn.js";
import WhereBetweenColumns from "../statement/where/WhereBetweenColumns.js";
import OrWhereBetweenColumns from "../statement/where/OrWhereBetweenColumns.js";
import WhereNotBetweenColumns from "../statement/where/WhereNotBetweenColumns.js";
import OrWhereNotBetweenColumns from "../statement/where/OrWhereNotBetweenColumns.js";
import WhereRaw from "../statement/where/WhereRaw.js";
import OrWhereRaw from "../statement/where/OrWhereRaw.js";
import WhereAny from "../statement/where/WhereAny.js";
import WhereAll from "../statement/where/WhereAll.js";
import WhereNone from "../statement/where/WhereNone.js";
import Raw from "../statement/raw/Raw.js";
import Separator from "../../enums/Separator.js";
import WhereExists from "../statement/where/WhereExists.js";
import {Query} from "../Query.js";
import OrWhereExists from "../statement/where/OrWhereExists.js";
import WhereNotExists from "../statement/where/WhereNotExists.js";
import OrWhereNotExists from "../statement/where/OrWhereNotExists.js";
import Condition from "../../enums/Condition.js";
import WhereNot from "../statement/where/WhereNot.js";
import OrWhereNot from "../statement/where/OrWhereNot.js";

export default class WhereCallback {
    /** @type {Group}  */
    #query;

    /**
     * @param {Group} groupQuery
     */
    constructor(groupQuery) {
        this.#query = groupQuery;
    }

    /**
     * @param {string|Raw} column
     * @param {string|number|null} [operator=null]
     * @param {string|number|null} [value=null]
     * @returns WhereCallback
     * @throws InvalidComparisonOperatorError
     */
    where(column, operator = null, value = null) {
        if (column instanceof Raw) {
            this.#query.push(column.withSeparator(Separator.And));
            return this;
        }

        this.#query.push(new Where(column, operator, value));

        return this;
    }

    /**
     * @param {string|Raw} column
     * @param {string|number|null} [operator=null]
     * @param {string|number|null} [value=null]
     * @returns Query
     * @throws InvalidComparisonOperatorError
     * @description Add a basic where clause to the query.
     */
    whereNot(column, operator = null, value = null) {
        if (column instanceof Raw) {
            this.#query.push(column.withSeparator(Separator.And).prependStatement(Condition.Not));
            return this;
        }

        this.#query.push(new WhereNot(column, operator, value));

        return this;
    }

    /**
     * @param {string|Raw} column
     * @param {string|number|null} [operator=null]
     * @param {string|number|null} [value=null]
     * @returns Query
     * @throws InvalidComparisonOperatorError
     * @description Add a basic where clause to the query.
     */
    orWhereNot(column, operator = null, value = null) {
        if (column instanceof Raw) {
            this.#query.push(column.withSeparator(Separator.Or).prependStatement(Condition.Not));
            return this;
        }

        this.#query.push(new OrWhereNot(column, operator, value));

        return this;
    }

    /**
     * @param {string|Raw} column
     * @param {string|number|null} [operator=null]
     * @param {string|number|null} [value=null]
     * @returns WhereCallback
     * @throws InvalidComparisonOperatorError
     */
    orWhere(column, operator = null, value = null) {
        if (column instanceof Raw) {
            this.#query.push(column.withSeparator(Separator.Or));
            return this;
        }

        this.#query.push(new OrWhere(column, operator, value));

        return this;
    }

    /**
     * @param {{(query: Query)}|Query} query
     * @returns WhereCallback
     */
    whereExists(query) {
        this.#whereExistsBuilder(query, WhereExists);

        return this;
    }

    /**
     * @param {{(query: Query)}|Query} query
     * @returns WhereCallback
     */
    orWhereExists(query) {
        this.#whereExistsBuilder(query, OrWhereExists);

        return this;
    }

    /**
     * @param {{(query: Query)}|Query} query
     * @returns WhereCallback
     */
    whereNotExists(query) {
        this.#whereExistsBuilder(query, WhereNotExists);

        return this;
    }

    /**
     * @param {{(query: Query)}|Query} query
     * @returns WhereCallback
     */
    orWhereNotExists(query) {
        this.#whereExistsBuilder(query, OrWhereNotExists);

        return this;
    }

    /**
     * @param {{(query: Query)}|Query} query
     * @param {Base} baseClass
     */
    #whereExistsBuilder(query, baseClass) {
        let builder = query;

        if (typeof query === "function") {
            builder = query(new Query());
        }

        this.#query.push(new baseClass(builder));
    }

    /**
     * @param {String} expression
     * @param {Array<String|number>|null} [bindings=null]
     * @returns WhereCallback
     */
    whereRaw(expression, bindings = null) {
        this.#query.push(new WhereRaw(expression, bindings));

        return this;
    }

    /**
     * @param {String} expression
     * @param {Array<String|number>|null} [bindings=null]
     * @returns WhereCallback
     */
    orWhereRaw(expression, bindings = null) {
        this.#query.push(new OrWhereRaw(expression, bindings));

        return this;
    }

    /**
     * @param {string} column
     * @returns WhereCallback
     */
    whereNull(column) {
        this.#query.push(new WhereNull(column));

        return this;
    }

    /**
     * @param {string} column
     * @returns WhereCallback
     */
    orWhereNull(column) {
        this.#query.push(new OrWhereNull(column));

        return this;
    }

    /**
     * @param {string} column
     * @returns WhereCallback
     */
    whereNotNull(column) {
        this.#query.push(new WhereNotNull(column));

        return this;
    }

    /**
     * @param {string} column
     * @returns WhereCallback
     */
    orWhereNotNull(column) {
        this.#query.push(new OrWhereNotNull(column));

        return this;
    }

    /**
     * @param {Array<String>} columns
     * @param {String} operator
     * @param {String|number} value
     * @returns WhereCallback
     */
    whereAny(columns, operator, value) {
        this.#query.push(new WhereAny(columns, operator, value));

        return this;
    }

    /**
     * @param {Array<String>} columns
     * @param {String} operator
     * @param {String|number} value
     * @returns WhereCallback
     */
    whereAll(columns, operator, value) {
        this.#query.push(new WhereAll(columns, operator, value));

        return this;
    }

    /**
     * @param {Array<String>} columns
     * @param {String} operator
     * @param {String|number} value
     * @returns WhereCallback
     */
    whereNone(columns, operator, value) {
        this.#query.push(new WhereNone(columns, operator, value));

        return this;
    }

    /**
     * @param {string} column
     * @param {Array<string|number>} values
     * @returns WhereCallback
     */
    whereIn(column, values) {
        this.#query.push(new WhereIn(column, values));

        return this;
    }

    /**
     * @param {string} column
     * @param {Array<string|number>} values
     * @returns WhereCallback
     */
    orWhereIn(column, values) {
        this.#query.push(new OrWhereIn(column, values));

        return this;
    }

    /**
     * @param {string} column
     * @param {Array<string|number>} values
     * @returns WhereCallback
     */
    whereNotIn(column, values) {
        this.#query.push(new WhereNotIn(column, values));

        return this;
    }

    /**
     * @param {string} column
     * @param {Array<string|number>} values
     * @returns WhereCallback
     */
    orWhereNotIn(column, values) {
        this.#query.push(new OrWhereNotIn(column, values));

        return this;
    }

    /**
     * @param {string} column
     * @param {Array<string|number>} values
     * @returns WhereCallback
     * @throws InvalidBetweenValueArrayLength
     */
    whereBetween(column, values) {
        Validation.validateBetweenArrayLength(values);

        this.#query.push(new WhereBetween(column, values));

        return this;
    }

    /**
     * @param {string} column
     * @param {Array<string|number>} values
     * @returns WhereCallback
     * @throws InvalidBetweenValueArrayLength
     */
    orWhereBetween(column, values) {
        Validation.validateBetweenArrayLength(values);

        this.#query.push(new OrWhereBetween(column, values));

        return this;
    }

    /**
     * @param {string} column
     * @param {Array<string|number>} values
     * @returns WhereCallback
     * @throws InvalidBetweenValueArrayLength
     */
    whereNotBetween(column, values) {
        Validation.validateBetweenArrayLength(values);

        this.#query.push(new WhereNotBetween(column, values));

        return this;
    }

    /**
     * @param {string} column
     * @param {Array<string|number>} values
     * @returns WhereCallback
     * @throws InvalidBetweenValueArrayLength
     */
    orWhereNotBetween(column, values) {
        Validation.validateBetweenArrayLength(values);

        this.#query.push(new OrWhereNotBetween(column, values));

        return this;
    }

    /**
     * @param {string} column
     * @param {string} operator
     * @param {string|null} [comparisonColumn=null]
     * @returns WhereCallback
     * @throws InvalidComparisonOperatorError
     */
    whereColumn(column, operator, comparisonColumn = null) {
        if (!comparisonColumn) {
            comparisonColumn = operator;
            operator = '=';
        }

        Validation.validateComparisonOperator(operator);

        this.#query.push(new WhereColumn(column, operator, comparisonColumn));

        return this;
    }

    /**
     * @param {string} column
     * @param {string} operator
     * @param {string|null} [comparisonColumn=null]
     * @returns WhereCallback
     * @throws InvalidComparisonOperatorError
     */
    orWhereColumn(column, operator, comparisonColumn = null) {
        if (!comparisonColumn) {
            comparisonColumn = operator;
            operator = '=';
        }

        Validation.validateComparisonOperator(operator);

        this.#query.push(new OrWhereColumn(column, operator, comparisonColumn));

        return this;
    }

    /**
     * @param {string} column
     * @param {Array<string>} columns
     * @returns WhereCallback
     * @throws InvalidBetweenValueArrayLength
     */
    whereBetweenColumns(column, columns) {
        Validation.validateBetweenArrayLength(columns);

        this.#query.push(new WhereBetweenColumns(column, columns));

        return this;
    }

    /**
     * @param {string} column
     * @param {Array<string>} columns
     * @returns WhereCallback
     * @throws InvalidBetweenValueArrayLength
     */
    orWhereBetweenColumns(column, columns) {
        Validation.validateBetweenArrayLength(columns);

        this.#query.push(new OrWhereBetweenColumns(column, columns));

        return this;
    }

    /**
     * @param {string} column
     * @param {Array<string>} columns
     * @returns WhereCallback
     * @throws InvalidBetweenValueArrayLength
     */
    whereNotBetweenColumns(column, columns) {
        Validation.validateBetweenArrayLength(columns);

        this.#query.push(new WhereNotBetweenColumns(column, columns));

        return this;
    }

    /**
     * @param {string} column
     * @param {Array<string>} columns
     * @returns WhereCallback
     * @throws InvalidBetweenValueArrayLength
     */
    orWhereNotBetweenColumns(column, columns) {
        Validation.validateBetweenArrayLength(columns);

        this.#query.push(new OrWhereNotBetweenColumns(column, columns));

        return this;
    }

}