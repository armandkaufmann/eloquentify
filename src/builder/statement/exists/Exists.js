export class Exists {
    /** @type {?Query} */
    _baseQuery = null;

    /**
     * @param {Query} baseQuery
     */
    constructor(baseQuery) {
        this._baseQuery = baseQuery;
    }

    /**
     * @return PrepareObject
     */
    prepare() {
        const basePreparedQuery = this._baseQuery.prepare().query;
        const finalQuery = `SELECT EXISTS(${basePreparedQuery})`;

        return {
            query: finalQuery,
            bindings: this._baseQuery.prepare().bindings
        }
    }

    /**
     * @return string
     */
    toString() {
        const basePreparedQuery = this._baseQuery.toString();
        return `SELECT EXISTS(${basePreparedQuery})`;
    }


}