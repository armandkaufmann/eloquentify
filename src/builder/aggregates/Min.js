import {BaseAggregate} from "./BaseAggregate.js";

export class Min extends BaseAggregate {
    /**
     * @param {Query} baseQuery
     * @param {String} column
     */
    constructor(baseQuery, column) {
        super(baseQuery, column, "MIN");
    }

    /**
     * @return PrepareObject
     */
    prepare() {
        return this._prepareObject(this.buildColumn());
    }
}