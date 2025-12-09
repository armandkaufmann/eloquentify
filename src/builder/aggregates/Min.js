import {BaseAggregate} from "./BaseAggregate.js";

export class Min extends BaseAggregate {
    /**
     * @param {Query} baseQuery
     * @param {String|Raw} column
     */
    constructor(baseQuery, column) {
        super(baseQuery, column, "MIN");
    }
}