import {MissingRequiredArgument} from "../../errors/QueryBuilder/Errors.js";
import {Utility} from "../../utils/Utility.js";
import Raw from "../statement/raw/Raw.js";

export const AGGREGATE_TABLE_ALIAS = "temp_table";
export const AGGREGATE_COLUMN_ALIAS = "aggregate";

export class BaseAggregate {
    /** @type {?Query} */
    _baseQuery = null;
    /** @type {string} */
    _column = "";
    /** @type {string} */
    _method = "";

    /**
     * @param {Query} baseQuery
     * @param {String|Raw} column
     * @param {String} method
     */
    constructor(baseQuery, column, method) {
        if (!column) {
            throw new MissingRequiredArgument(BaseAggregate.name, "constructor");
        }

        this._baseQuery = baseQuery;
        this._column = column;
        this._method = method;
    }

    /**
     * @return PrepareObject
     */
    prepare() {
        const columnString = this.buildColumn();
        const baseQueryPrepare = this._baseQuery.prepare();

        const combinedQuery = `SELECT ${this._method}(${columnString}) AS ${AGGREGATE_COLUMN_ALIAS} FROM (${baseQueryPrepare.query}) AS ${AGGREGATE_TABLE_ALIAS}`;

        return {
            query: combinedQuery,
            bindings: baseQueryPrepare.bindings
        }
    }

    /**
     * @return string
     */
    toString() {
        const columnString = this.buildColumn();
        const baseQueryPrepare = this._baseQuery.toString();

        return `SELECT ${this._method}(${columnString}) AS ${AGGREGATE_COLUMN_ALIAS} FROM (${baseQueryPrepare}) AS ${AGGREGATE_TABLE_ALIAS}`;
    }

    /**
     * @return string
     */
    buildColumn() {
        if (this._column instanceof Raw) {
            return this._column.toString()
        }

        return `${AGGREGATE_TABLE_ALIAS}.${Utility.escapeColumnString(this._column)}`;
    }
}