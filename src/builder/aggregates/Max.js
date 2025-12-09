import {BaseAggregate} from "./BaseAggregate.js";

export class Max extends BaseAggregate {
    /**
     * @param {Query} baseQuery
     * @param {String|Raw} column
     */
    constructor(baseQuery, column) {
        super(baseQuery, column, "MAX");
    }
}