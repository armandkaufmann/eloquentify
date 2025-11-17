import {STATEMENTS} from "./Base.js";

export default class Builder {
    /** @type {Array<Base|Group>} */
    #statements = [];
    /** @type {Statement} */
    #type;
    /** @type {Boolean} */
    #withStatement;
    /** @type {string|null} */
    #defaultQueryPartial = null;
    /** @type {string} */
    #glue = " ";
    /** @type {Boolean} */
    #withDistinct = false;

    /**
     * @param {Statement} type
     */
    constructor(type) {
        this.#type = type;
        this.#parseType();
        this.#prepareBuilder();
    }

    /**
     * @param {Base} statement
     * @return Builder
     */
    push(statement) {
        if (this.#isNotAppendable()) {
            this.#statements = [statement];

            return this;
        }

        this.#statements.push(statement);

        return this;
    }

    /**
     * @param {Boolean} [withCondition=true]
     * @return String
     */
    toString(withCondition = true) {
        if (this.#defaultQueryPartial && this.#statements.length === 0) {
            return this.#formatFullStatement(this.#defaultQueryPartial);
        }

        let result = this.#statements
            .filter((statement) => statement.toString(false))
            .map((statement, index) => statement.toString(index !== 0))
            .join(this.#glue);

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
        if (this.#defaultQueryPartial && this.#statements.length === 0) {
            return {query: this.#formatFullStatement(this.#defaultQueryPartial), bindings: []};
        }

        /** @type {PrepareObject} */
        let result = this.#statements
            .reduce((result, statement, index) => {
                const prepare = statement.prepare(index !== 0);

                result.query += `${index > 0 ? this.#glue : ''}${prepare.query}`;
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
        if (this.#type !== STATEMENTS.select) {
            throw new Error("Can not set distinct in a non-select statement builder.")
        }

        this.#withDistinct = true;
    }

    toggleWithStatement(withStatement) {
        this.#withStatement = withStatement;

        return this;
    }

    /**
     * @return Builder
     */
    clone() {
        const clone = new Builder(this.#type);
        clone._hydrate(
            this.#statements.map((statement) => statement.clone()),
            this.#type,
            this.#withStatement,
            this.#defaultQueryPartial,
            this.#glue,
            this.#withDistinct,
        );

        return clone;
    }

    /**
     * @return Boolean
     */
    isEmpty() {
        return this.#statements.length === 0;
    }

    /**
     * @param {Array<Base|Group>} statements
     * @param {Boolean} type
     * @param {Boolean} withStatement
     * @param {string|null} defaultQueryPartial
     * @param {string} glue
     * @param {Boolean} withDistinct
     * @return Builder
     */
    _hydrate(statements, type, withStatement, defaultQueryPartial, glue, withDistinct) {
        this.#statements = statements;
        this.#type = type;
        this.#withStatement = withStatement;
        this.#defaultQueryPartial = defaultQueryPartial;
        this.#glue = glue;
        this.#withDistinct = withDistinct;
    }

    #isNotAppendable() {
        return this.#type === STATEMENTS.limit || this.#type === STATEMENTS.offset;
    }

    /**
     * @param {string} query
     * @return string
     */
    #formatFullStatement(query) {
        let result = "";

        if (this.#withStatement) {
            result += `${this.#type} `;
        }

        if (this.#withDistinct && query !== this.#defaultQueryPartial) {
            result += 'DISTINCT '
        }

        return result + query;
    }

    #parseType() {
        switch (this.#type) {
            case STATEMENTS.join:
            case STATEMENTS.none:
                this.#withStatement = false;
                break;
            default:
                this.#withStatement = true;
        }
    }

    #prepareBuilder() {
        switch (this.#type) {
            case STATEMENTS.select:
                this.#defaultQueryPartial = '*';
                this.#glue = "";
                break;
            case STATEMENTS.orderBy:
            case STATEMENTS.group:
                this.#glue = "";
                break;
            default:
                break;
        }
    }
}