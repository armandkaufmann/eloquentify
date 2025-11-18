import "./Base.types.js";
import Builder from "./Builder.js";
import {STATEMENTS} from "./Base.js";
import Condition from "../../enums/Condition.js";

export default class Group extends Builder {
    /** @type {"AND"|"OR"} */
    _condition = Condition.And;

    /**
     * @param {"AND"|"OR"} [condition="AND"]
     */
    constructor(condition = Condition.And) {
        super(STATEMENTS.none);
        this._condition = condition;
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
        };
    }

    /**
     * @param {Object} attributes
     */
    _hydrate(attributes) {
        super._hydrate(attributes);
        this._condition = attributes?.condition ?? this._condition;
    }

}