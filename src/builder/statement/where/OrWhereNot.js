import Separator from "../../../enums/Separator.js";
import WhereNot from "./WhereNot.js";

export default class OrWhereNot extends WhereNot {

    /**
     * @param {String} column
     * @param {String} operator
     * @param {String|number|null} [value=null]
     */
    constructor(column, operator, value = null) {
        super(column, operator, value, Separator.Or);
    }
}