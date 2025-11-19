import {STATEMENTS} from "./Base.js";

export default class Builder {
    /** @type {Array<Base|Group>} */
    _statements = [];
    /** @type {Statement} */
    _type;
    /** @type {Boolean} */
    _withStatement;
    /** @type {string|null} */
    _defaultQueryPartial = null;
    /** @type {string} */
    _glue = " ";
    /** @type {Boolean} */
    _withDistinct = false;

    /**
     * @param {Statement} type
     */
    constructor(type) {
        this._type = type;
        this.#parseType();
        this.#prepareBuilder();
    }

    /**
     * @param {Base} statement
     * @return Builder
     */
    push(statement) {
        if (this.#isNotAppendable()) {
            this._statements = [statement];

            return this;
        }

        this._statements.push(statement);

        return this;
    }

    /**
     * @param {Boolean} [withCondition=true]
     * @return String
     */
    toString(withCondition = true) {
        if (this._defaultQueryPartial && this._statements.length === 0) {
            return this.#formatFullStatement(this._defaultQueryPartial);
        }

        let result = this._statements
            .filter((statement) => statement.toString(false))
            .map((statement, index) => statement.toString(index !== 0))
            .join(this._glue);

        if (result) {
            result = this.#formatFullStatement(result);
        }

        return result;
    }

    /**
     * @param {Boolean} [withCondition=true]
     * @return PrepareObject
     */
    prepare(withCondition = true) {
        if (this._defaultQueryPartial && this._statements.length === 0) {
            return {query: this.#formatFullStatement(this._defaultQueryPartial), bindings: []};
        }

        /** @type {PrepareObject} */
        let result = this._statements
            .reduce((result, statement, index) => {
                const prepare = statement.prepare(index !== 0);

                result.query += `${index > 0 ? this._glue : ''}${prepare.query}`;
                result.bindings.push(...prepare.bindings);

                return result;
            }, {
                query: "",
                bindings: []
            });

        if (result.query) {
            result.query = this.#formatFullStatement(result.query);
        }

        return result;
    }

    setDistinct() {
        if (this._type !== STATEMENTS.select) {
            throw new Error("Can not set distinct in a non-select statement builder.")
        }

        this._withDistinct = true;
    }

    toggleWithStatement(withStatement) {
        this._withStatement = withStatement;

        return this;
    }

    /**
     * @return Builder
     */
    clone() {
        return this._clone(new Builder(this._type));
    }

    /**
     * @return Boolean
     */
    isEmpty() {
        return this._statements.length === 0;
    }

    /**
     * @template T
     * @param {T} newClass
     * @return {T}
     */
    _clone(newClass) {
        const attributes = this._getAttributes();

        attributes.statements = attributes.statements.map((statement) => statement.clone());
        newClass._hydrate(attributes);

        return newClass;
    }

    /**
     * @returns Object
     */
    _getAttributes() {
        return {
            statements: this._statements,
            type: this._type,
            withStatement: this._withStatement,
            defaultQueryPartial: this._defaultQueryPartial,
            glue: this._glue,
            withDistinct: this._withDistinct,
        };
    }

    /**
     * @param {Object} attributes
     */
    _hydrate(attributes) {
        this._statements = attributes?.statements ?? this._statements;
        this._type = attributes?.type ?? this._type;
        this._withStatement = attributes?.withStatement ?? this._withStatement;
        this._defaultQueryPartial = attributes?.defaultQueryPartial ?? this._defaultQueryPartial;
        this._glue = attributes?.glue ?? this._glue;
        this._withDistinct = attributes?.withDistinct ?? this._withDistinct;
    }

    #isNotAppendable() {
        return this._type === STATEMENTS.limit || this._type === STATEMENTS.offset;
    }

    /**
     * @param {string} query
     * @return string
     */
    #formatFullStatement(query) {
        let result = "";

        if (this._withStatement) {
            result += `${this._type} `;
        }

        if (this._withDistinct && query !== this._defaultQueryPartial) {
            result += 'DISTINCT '
        }

        return result + query;
    }

    #parseType() {
        switch (this._type) {
            case STATEMENTS.join:
            case STATEMENTS.none:
                this._withStatement = false;
                break;
            default:
                this._withStatement = true;
        }
    }

    #prepareBuilder() {
        switch (this._type) {
            case STATEMENTS.select:
                this._defaultQueryPartial = '*';
                this._glue = "";
                break;
            case STATEMENTS.orderBy:
            case STATEMENTS.group:
                this._glue = "";
                break;
            default:
                break;
        }
    }
}