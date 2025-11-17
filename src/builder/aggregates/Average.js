import {BaseAggregate} from "./BaseAggregate.js";

export class Average extends BaseAggregate {
    /**
     * @param {Query} baseQuery
     * @param {String} column
     */
    constructor(baseQuery, column) {
        super(baseQuery, column, "AVG");
    }

    /**
     * @return PrepareObject
     */
    prepare() {
        return this._prepareObject(this.buildColumn());
    }
}