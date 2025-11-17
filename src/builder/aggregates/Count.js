import {Utility} from "../../utils/Utility.js";
import {AGGREGATE_TABLE_ALIAS, BaseAggregate} from "./BaseAggregate.js";

export class Count extends BaseAggregate {
    /**
     * @param {Query} baseQuery
     * @param {String} [column="*"]
     */
    constructor(baseQuery, column = "*") {
        super(baseQuery, column, "COUNT");
    }

    /**
     * @return PrepareObject
     */
    prepare() {
        const columnString = this._column === "*"
            ? "*"
            : this.buildColumn();

        return this._prepareObject(columnString);
    }
}