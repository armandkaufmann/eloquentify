import {Base} from "../Base.js";

export default class Raw extends Base {

    /**
     * @param {String} statement
     * @param {String|null} [separator=null]
     * @returns Query
     */
    constructor(statement, separator = null) {
        super([], statement, separator);
    }

    /**
     * @param {String} separator
     * @returns Raw
     */
    withSeparator(separator) {
        this._separator = separator;

        return this;
    }

    /**
     * @param {String} string
     * @returns Raw
     */
    appendStatement(string) {
        this._query += ` ${string}`;

        return this;
    }

    /**
     * @param {String} string
     * @returns Raw
     */
    prependStatement(string) {
        this._query = `${string} ${this._query}`;

        return this;
    }
}