import {Base} from "../Base.js";
import {Utility} from "../../../utils/Utility.js";
import Separator from "../../../enums/Separator.js";
import Validation from "../../../utils/Validation.js";

export default class Where extends Base {

    /**
     * @param {String} column
     * @param {String} operator
     * @param {String|number|null} [value=null]
     * @param {String} [separator='AND']
     */
    constructor(column, operator, value = null, separator = Separator.And) {
        if (!value) {
            value = operator;
            operator = '=';
        }

        Validation.validateComparisonOperator(operator);

        const query = `${Utility.escapeColumnString(column)} ${operator} ?`;
        const bindings = [value];

        super(bindings, query, separator);
    }
}