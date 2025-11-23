import {BaseAggregate} from "./BaseAggregate.js";

export class Count extends BaseAggregate {
    /**
     * @param {Query} baseQuery
     * @param {String} [column="*"]
     */
    constructor(baseQuery, column = "*") {
        super(baseQuery, column, "COUNT");
    }

    /**
     * @return string
     */
    buildColumn() {
        return this._column === "*"
            ? "*"
            : super.buildColumn();
    }
}