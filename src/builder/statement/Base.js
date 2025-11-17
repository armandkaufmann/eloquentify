import {Utility} from "../../utils/Utility.js";
import "./Base.types.js"

/**
 * @enum {Statement}
 */
export const STATEMENTS = {
    select: 'SELECT',
    from: 'FROM',
    join: 'JOIN',
    where: 'WHERE',
    group: 'GROUP BY',
    having: 'HAVING',
    orderBy: 'ORDER BY',
    limit: 'LIMIT',
    offset: 'OFFSET',
    none: 'NONE'
}

export class Base {
    _bindings;
    _query;
    _separator;

    /**
     * @param {Array<String|Number>} bindings
     * @param {String} query
     * @param {String|null} [separator=null]
     */
    constructor(bindings, query, separator = null) {
        this._bindings = bindings;
        this._query = query;
        this._separator = separator;
    }

    /**
     * @param {Boolean} [withSeparator=false]
     * @returns String
     */
    toString(withSeparator = false) {
        let result = this.#mergeBindings(this._query, this._bindings);

        if (withSeparator) {
            result = `${this._separator ? `${this._separator} ` : ''}${result}`;
        }

        return result;
    }

    /**
     * @param {Boolean} [withSeparator=false]
     * @returns PrepareObject
     */
    prepare(withSeparator = false) {
        let result = {
            query: this._query,
            bindings: this._bindings
        }

        if (withSeparator) {
            result.query = `${this._separator ? `${this._separator} ` : ''}${result.query}`;
        }

        return result;
    }

    /**
     * @returns Base
     */
    clone() {
        return new Base(
            [...this._bindings],
            this._query,
            this._separator
        );
    }

    /**
     * @param {string} query
     * @param {Array<String|Number>} bindings
     * @param {String|'?'} [replacer='?']
     * @returns String
     */
    #mergeBindings(query, bindings, replacer = '?') {
        let result = ``;
        let bindingsIndex = 0;

        for (let i = 0; i < query.length; i++) {
            if (query[i] === replacer) {
                result += Utility.valueToString(bindings[bindingsIndex]);
                bindingsIndex++;
            } else {
                result += query[i];
            }
        }

        return result;
    }
}