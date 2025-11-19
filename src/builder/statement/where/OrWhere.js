import Where from "./Where.js";
import Separator from "../../../enums/Separator.js";

export default class OrWhere extends Where {

    /**
     * @param {string} column
     * @param {string} operator
     * @param {string|number|null} [value=null]
     */
    constructor(column, operator, value = null) {
        super(column, operator, value, Separator.Or);
    }
}