import Validation from "../../utils/Validation.js";
import Having from "../statement/having/Having.js";
import OrHaving from "../statement/having/OrHaving.js";
import HavingRaw from "../statement/having/HavingRaw.js";
import OrHavingRaw from "../statement/having/OrHavingRaw.js";
import HavingBetween from "../statement/having/HavingBetween.js";
import OrHavingBetween from "../statement/having/OrHavingBetween.js";
import Raw from "../statement/raw/Raw.js";
import Separator from "../../enums/Separator.js";

export default class HavingCallback {
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
     * @param {string|number|null|boolean} [operator=null]
     * @param {string|number|null|boolean} [value=null]
     * @returns HavingCallback
     * @throws InvalidComparisonOperatorError
     */
    having(column, operator = null, value = null) {
        if (column instanceof Raw) {
            this.#query.push(column.withSeparator(Separator.And));
            return this;
        }

        if (!value) {
            value = operator;
            operator = '=';
        }

        Validation.validateComparisonOperator(operator);

        this.#query.push(new Having(column, operator, value));

        return this;
    }

    /**
     * @param {string|Raw} column
     * @param {string|number|null|boolean} [operator=null]
     * @param {string|number|null|boolean} [value=null]
     * @returns HavingCallback
     * @throws InvalidComparisonOperatorError
     */
    orHaving(column, operator= null, value = null) {
        if (column instanceof Raw) {
            this.#query.push(column.withSeparator(Separator.Or));
            return this;
        }

        if (!value) {
            value = operator;
            operator = '=';
        }

        Validation.validateComparisonOperator(operator);

        this.#query.push(new OrHaving(column, operator, value));

        return this;
    }

    /**
     * @param {string} expression
     * @param {Array<String|Number>|null} [bindings=null]
     * @returns HavingCallback
     */
    havingRaw(expression, bindings = null) {
        this.#query.push(new HavingRaw(expression, bindings));

        return this;
    }

    /**
     * @param {string} expression
     * @param {Array<String|Number>|null} [bindings=null]
     * @returns HavingCallback
     */
    orHavingRaw(expression, bindings = null) {
        this.#query.push(new OrHavingRaw(expression, bindings));

        return this;
    }

    /**
     * @param {string} column
     * @param {Array<String|Number>} values
     * @returns HavingCallback
     * @throws InvalidBetweenValueArrayLength
     */
    havingBetween(column, values) {
        Validation.validateBetweenArrayLength(values);

        this.#query.push(new HavingBetween(column, values));

        return this;
    }

    /**
     * @param {string} column
     * @param {Array<String|Number>} values
     * @returns HavingCallback
     * @throws InvalidBetweenValueArrayLength
     */
    orHavingBetween(column, values) {
        Validation.validateBetweenArrayLength(values);

        this.#query.push(new OrHavingBetween(column, values));

        return this;
    }

}