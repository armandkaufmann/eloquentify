import {BaseAggregate} from "./BaseAggregate.js";

export class Sum extends BaseAggregate {
    /**
     * @param {Query} baseQuery
     * @param {String} column
     */
    constructor(baseQuery, column) {
        super(baseQuery, column, "SUM");
    }
}