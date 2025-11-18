import "./Base.types.js";
import Builder from "./Builder.js";
import {STATEMENTS} from "./Base.js";
import Condition from "../../enums/Condition.js";

export default class Group extends Builder {
    /** @type {"AND"|"OR"} */
    _condition = Condition.And;
    /** @type {string|null} */
    _prependString = null;

    /**
     * @param {"AND"|"OR"} [condition="AND"]
     * @param {string|null} [prependString=null]
     */
    constructor(condition = Condition.And, prependString = null) {
        super(STATEMENTS.none);
        this._condition = condition;
        this._prependString = prependString;
    }

    /**
     * @param {Boolean} withCondition
     * @return String
     */
    toString(withCondition) {
        let query = super.toString();

        if (query) {
            query = `(${query})`;
        }

        if (this._prependString) {
            query = `${this._prependString} ${query}`;
        }

        if (withCondition && query) {
            query = `${this._condition} ${query}`;
        }

        return query;
    }

    /**
     * @param {Boolean} withCondition
     * @return PrepareObject
     */
    prepare(withCondition) {
        let prepareObject = super.prepare();

        if (prepareObject.query) {
            prepareObject.query = `(${prepareObject.query})`;
        }

        if (withCondition && prepareObject.query) {
            prepareObject.query = `${this._condition} ${prepareObject.query}`;
        }

        return prepareObject;
    }

    /**
     * @return Group
     */
    clone() {
        return this._clone(new Group(this._condition))
    }

    /**
     * @returns Object
     */
    _getAttributes() {
        const parentAttributes = super._getAttributes();
        return {
            ...parentAttributes,
            condition: this._condition,
            prependString: this._prependString
        };
    }

    /**
     * @param {Object} attributes
     */
    _hydrate(attributes) {
        super._hydrate(attributes);
        this._condition = attributes?.condition ?? this._condition;
        this._prependString = attributes?.prependString ?? this._prependString;
    }

}