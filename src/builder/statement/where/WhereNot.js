import {Base} from "../Base.js";
import {Utility} from "../../../utils/Utility.js";
import Separator from "../../../enums/Separator.js";

export default class WhereNot extends Base {

    /**
     * @param {String} column
     * @param {String} operator
     * @param {String|number} value
     * @param {String} [separator='AND']
     */
    constructor(column, operator, value, separator = Separator.And) {
        const query = `NOT ${Utility.escapeColumnString(column)} ${operator} ?`;
        const bindings = [value];

        super(bindings, query, separator);
    }
}