import {Utility} from "../utils/Utility.js";
import {
    InvalidBetweenValueArrayLength,
    InvalidComparisonOperatorError,
    TableNotSetError
} from "../errors/QueryBuilder/Errors.js";
import {DB} from "../DB.js";
import Builder from "./statement/Builder.js";
import {STATEMENTS} from "./statement/Base.js";
import Where from "./statement/where/Where.js";
import OrWhere from "./statement/where/OrWhere.js";
import WhereNull from "./statement/where/WhereNull.js";
import OrWhereNull from "./statement/where/OrWhereNull.js";
import WhereNotNull from "./statement/where/WhereNotNull.js";
import OrWhereNotNull from "./statement/where/OrWhereNotNull.js";
import WhereIn from "./statement/where/WhereIn.js";
import OrWhereIn from "./statement/where/OrWhereIn.js";
import WhereNotIn from "./statement/where/WhereNotIn.js";
import OrWhereNotIn from "./statement/where/OrWhereNotIn.js";
import WhereBetween from "./statement/where/WhereBetween.js";
import OrWhereBetween from "./statement/where/OrWhereBetween.js";
import WhereNotBetween from "./statement/where/WhereNotBetween.js";
import OrWhereNotBetween from "./statement/where/OrWhereNotBetween.js";
import Select from "./statement/select/Select.js";
import Group from "./statement/Group.js";
import WhereBetweenColumns from "./statement/where/WhereBetweenColumns.js";
import OrWhereBetweenColumns from "./statement/where/OrWhereBetweenColumns.js";
import WhereNotBetweenColumns from "./statement/where/WhereNotBetweenColumns.js";
import OrWhereNotBetweenColumns from "./statement/where/OrWhereNotBetweenColumns.js";
import WhereColumn from "./statement/where/WhereColumn.js";
import OrWhereColumn from "./statement/where/OrWhereColumn.js";
import InnerJoin from "./statement/join/InnerJoin.js";
import LeftJoin from "./statement/join/LeftJoin.js";
import CrossJoin from "./statement/join/CrossJoin.js";
import Validation from "../utils/Validation.js";
import WhereCallback from "./callback/WhereCallback.js";
import From from "./statement/from/From.js";
import SelectRaw from "./statement/select/SelectRaw.js";
import WhereRaw from "./statement/where/WhereRaw.js";
import OrWhereRaw from "./statement/where/OrWhereRaw.js";
import Having from "./statement/having/Having.js";
import OrHaving from "./statement/having/OrHaving.js";
import HavingRaw from "./statement/having/HavingRaw.js";
import OrHavingRaw from "./statement/having/OrHavingRaw.js";
import GroupBy from "./statement/group/GroupBy.js";
import GroupByRaw from "./statement/group/GroupByRaw.js";
import OrderBy from "./statement/order/OrderBy.js";
import OrderByDesc from "./statement/order/OrderByDesc.js";
import WhereAny from "./statement/where/WhereAny.js";
import WhereAll from "./statement/where/WhereAll.js";
import WhereNone from "./statement/where/WhereNone.js";
import Limit from "./statement/limit/Limit.js";
import Offset from "./statement/offset/Offset.js";
import HavingBetween from "./statement/having/HavingBetween.js";
import OrHavingBetween from "./statement/having/OrHavingBetween.js";
import HavingCallback from "./callback/HavingCallback.js";
import Raw from "./statement/raw/Raw.js";
import Separator from "../enums/Separator.js";
import Condition from "../enums/Condition.js";
import WhereExists from "./statement/where/WhereExists.js";
import OrWhereExists from "./statement/where/OrWhereExists.js";
import WhereNotExists from "./statement/where/WhereNotExists.js";
import OrWhereNotExists from "./statement/where/OrWhereNotExists.js";
import {Count} from "./aggregates/Count.js";
import {Sum} from "./aggregates/Sum.js";
import {Average} from "./aggregates/Average.js";
import {Min} from "./aggregates/Min.js";
import {Max} from "./aggregates/Max.js";
import WhereNot from "./statement/where/WhereNot.js";
import OrWhereNot from "./statement/where/OrWhereNot.js";

export class Query {
    /** @type {?string} */
    #table = null;
    /** @type {?Model} */
    #model = null;
    /** @type {boolean} */
    #toSql = false;
    /** @type {Builder}  */
    #querySelect = new Builder(STATEMENTS.select);
    /** @type {Builder}  */
    #queryFrom = new Builder(STATEMENTS.from);
    /** @type {Builder}  */
    #queryJoin = new Builder(STATEMENTS.join);
    /** @type Builder  */
    #queryWhere = new Builder(STATEMENTS.where);
    /** @type Builder  */
    #queryGroupBy = new Builder(STATEMENTS.group);
    /** @type Builder  */
    #queryHaving = new Builder(STATEMENTS.having);
    /** @type Builder  */
    #queryOrderBy = new Builder(STATEMENTS.orderBy);
    /** @type Builder  */
    #limit = new Builder(STATEMENTS.limit);
    /** @type Builder  */
    #offset = new Builder(STATEMENTS.offset);
    #database = new DB();

    /**
     * @param {string} table
     * @param {string|null} [as=null]
     * @returns Query
     * @description Begin a fluent query against a database table.
     */
    static from(table, as = null) {
        return new Query().from(table, as)
    }

    /**
     * @returns Query
     */
    static toSql() {
        return new Query().toSql()
    }

    /**
     * @param {Model} model
     * @returns Query
     */
    static castResultTo(model) {
        return new Query().castResultTo(model)
    }

    /**
     * @param {string} statement
     * @returns Raw
     * @description Create a raw database expression.
     */
    static raw(statement) {
        return new Raw(statement);
    }

    /**
     * @param {string} table
     * @param {string|null} [as=null]
     * @returns Query
     * @description Set the table which the query is targeting.
     */
    from(table, as = null) {
        this.#table = table;
        this.#queryFrom.push(new From(table, as))
        return this;
    }

    /**
     * @returns Query
     * @description set the query instance to return the raw unprepared query string at execution
     */
    toSql() {
        this.#toSql = true;

        return this;
    }

    /**
     * @param {Model} model
     * @returns Query
     */
    castResultTo(model) {
        this.#model = model;

        return this;
    }

    /**
     * @async
     * @param {...string|Raw|Array<string|Raw>} columns - add columns to be selected
     * @throws TableNotSetError
     * @returns {Promise<(Object|Model)[]>|Promise<[]>|[]}
     * @description Execute the query as a "select" statement.
     */
    async get(...columns) {
        this.#validateTableSet();

        if (columns) {
            this.select(...columns);
        }

        if (this.#toSql) {
            return this.#buildSelectQuery();
        }

        const prepareObject = this.#buildSelectQuery();
        return await this.#database.all(prepareObject.query, prepareObject.bindings);
    }

    /**
     * @async
     * @param {...string|Raw|Array<string|Raw>} columns - add columns to be selected
     * @throws TableNotSetError
     * @returns {Promise<Object|Model|null>|null}
     * @description Execute the query and get the first result.
     */
    async first(...columns) {
        this.#validateTableSet();

        this.limit(1);

        if (columns) {
            this.select(...columns);
        }

        if (this.#toSql) {
            return this.#buildSelectQuery();
        }

        const prepareObject = this.#buildSelectQuery();
        return await this.#database.get(prepareObject.query, prepareObject.bindings);
    }

    /**
     * @async
     * @param {number|string} id
     * @param {...string|Raw|Array<string|Raw>} columns - add columns to be selected
     * @throws TableNotSetError
     * @returns {Promise<Object|Model|null>|null}
     * @description Execute a query for a single record by ID.
     */
    async find(id, ...columns) {
        return this.where('id', '=', id).first(...columns);
    }

    /**
     * @async
     * @param {String} [column="*"]
     * @returns {Number}
     * @description Retrieve the "count" result of the query.
     */
    async count(column = "*") {
        return this._aggregate(Count, column);
    }

    /**
     * @async
     * @param {String} column
     * @returns {Number}
     * @throws MissingRequiredArgument
     * @description Retrieve the sum of the values of a given column.
     */
    async sum(column) {
        return this._aggregate(Sum, column);
    }

    /**
     * @async
     * @param {String} column
     * @returns {Number}
     * @throws MissingRequiredArgument
     * @description Retrieve the average of the values of a given column.
     */
    async avg(column) {
        return this._aggregate(Average, column);
    }

    /**
     * @async
     * @param {String} column
     * @returns {Number}
     * @throws MissingRequiredArgument
     * @description Retrieve the average of the values of a given column.
     */
    async average(column) {
        return this.avg(column);
    }

    /**
     * @async
     * @param {String} column
     * @returns {Number}
     * @throws MissingRequiredArgument
     * @description Retrieve the minimum value of a given column.
     */
    async min(column) {
        return this._aggregate(Min, column);
    }

    /**
     * @async
     * @param {String} column
     * @returns {Number}
     * @throws MissingRequiredArgument
     * @description Retrieve the maximum value of a given column.
     */
    async max(column) {
        return this._aggregate(Max, column);
    }

    /**
     * @async
     * @param {BaseAggregate} aggregateClass
     * @param {String} column
     * @returns {Number}
     */
    async _aggregate(aggregateClass, column) {
        //todo: check for unions too
        const clone = this.cloneWithout(this.#queryHaving.isEmpty() ? 'select' : '');
        const countAggregation = new aggregateClass(clone, column).prepare();

        const dbResult = await this.#database.all(countAggregation.query, countAggregation.bindings);

        return dbResult[0]?.aggregate ?? 0;
    }

    /**
     * @returns PrepareObject
     */
    prepare() {
        return this.#buildSelectQuery();
    }

    /**
     * @param {Object} attributes
     */
    _hydrate(attributes) {
        this.#table = attributes?.table ?? this.#table;
        this.#model = attributes?.model ?? this.#model;
        this.#toSql = attributes?.toSql ?? this.#toSql;
        this.#querySelect = attributes?.select ?? this.#querySelect;
        this.#queryFrom = attributes?.from ?? this.#queryFrom;
        this.#queryJoin = attributes?.join ?? this.#queryJoin;
        this.#queryWhere = attributes?.where ?? this.#queryWhere;
        this.#queryGroupBy = attributes?.groupBy ?? this.#queryGroupBy;
        this.#queryHaving = attributes?.having ?? this.#queryHaving;
        this.#queryOrderBy = attributes?.orderBy ?? this.#queryOrderBy;
        this.#limit = attributes?.limit ?? this.#limit;
        this.#offset = attributes?.offset ?? this.#offset;
    }

    /**
     * @returns Object
     */
    _getAttributes() {
        return {
            table: this.#table,
            model: this.#model,
            toSql: this.#toSql,
            select: this.#querySelect,
            from: this.#queryFrom,
            join: this.#queryJoin,
            where: this.#queryWhere,
            groupBy: this.#queryGroupBy,
            having: this.#queryHaving,
            orderBy: this.#queryOrderBy,
            limit: this.#limit,
            offset: this.#offset,
        };
    }

    /**
     * @param {?Array<string>} [exclude=[]]
     * @returns Object
     */
    _filterAttributes(exclude = []) {
        const attributes = this._getAttributes();

        Object.keys(attributes).map((key) => {
            if (exclude.includes(key)) {
                delete attributes[key];
                return;
            }

            if (attributes[key] instanceof Builder) {
                attributes[key] = attributes[key].clone();
            }
        });

        return attributes;
    }

    /**
     * @returns Query
     * @description Clone the query.
     */
    clone() {
        const clone = new Query();
        const attributes = this._filterAttributes();

        clone._hydrate(attributes);

        return clone;
    }

    /**
     * @param {...string} attributes
     * @returns Query
     * @description Clone the query without the given properties.
     */
    cloneWithout(...attributes) {
        const clone = new Query();
        const cloneAttributes = this._filterAttributes(attributes);

        clone._hydrate(cloneAttributes);

        return clone;
    }

    /**
     * @async
     * @param {Record<string, any>} fields
     * @returns {Promise<Boolean>}
     * @description Insert new records into the database.
     */
    async insert(fields) {
        this.#validateTableSet();

        if (this.#toSql) {
            return this.#buildInsertSqlQuery(fields);
        }

        const statement = this.#buildPreparedInsertSqlQuery(fields);
        return await this.#database.insert(statement.query, statement.bindings);
    }

    /**
     * @async
     * @param {Record<string, any>} fields
     * @returns {Promise<number|null>}
     * @description Insert a new record and get the value of the primary key (ID).
     */
    async insertGetId(fields) {
        this.#validateTableSet();

        if (this.#toSql) {
            return this.#buildInsertSqlQuery(fields);
        }

        const statement = this.#buildPreparedInsertSqlQuery(fields);
        return await this.#database.insert(statement.query, statement.bindings, true);
    }

    /**
     * @async
     * @param {Record<string, any>} fields
     * @returns {string|Promise<number|null>}
     * @description Update records in the database.
     */
    async update(fields) {
        this.#validateTableSet();

        if (this.#toSql) {
            return this.#buildFullUpdateSqlQuery(fields);
        }

        const statement = this.#buildFullUpdatePrepareObject(fields);
        return await this.#database.updateOrDelete(statement.query, statement.bindings);
    }

    /**
     * @async
     * @returns {string|Promise<number|null>} - number of records deleted.
     * @description Delete records from the database.
     */
    async delete() {
        this.#validateTableSet();

        if (this.#toSql) {
            return this.#buildFullDeleteSqlQuery();
        }

        const statement = this.#buildFullDeletePrepareObject();
        return await this.#database.updateOrDelete(statement.query, statement.bindings);
    }

    /**
     * @param {...string|Raw|Array<string|Raw>} columns
     * @returns Query
     * @description Set the columns to be selected.
     */
    select(...columns) {
        columns.forEach((column) => {
            if (column instanceof Raw) {
                this.#querySelect.push(column.withSeparator(Separator.Comma));
            } else if (Array.isArray(column)) {
                column.forEach((col) => this.#querySelect.push(new Select(col)));
            } else {
                this.#querySelect.push(new Select(column));
            }
        });

        return this;
    }

    /**
     * @param {String} expression
     * @param {Array<String|Number>|null} [bindings=null]
     * @returns Query
     * @description Add a new "raw" select expression to the query.
     */
    selectRaw(expression, bindings = null) {
        this.#querySelect.push(new SelectRaw(expression, bindings));

        return this;
    }

    /**
     * @returns Query
     * @description Force the query to only return distinct results.
     */
    distinct() {
        this.#querySelect.setDistinct();

        return this;
    }

    /**
     * @param {string} table
     * @param {string} localKey
     * @param {string} operator
     * @param {string} foreignKey
     * @returns Query
     * @throws InvalidComparisonOperatorError
     * @description Add a join clause to the query.
     */
    join(table, localKey, operator, foreignKey) {
        Validation.validateComparisonOperator(operator);

        this.#queryJoin.push(new InnerJoin(table, localKey, operator, foreignKey));

        return this;
    }

    /**
     * @param {string} table
     * @param {string} localKey
     * @param {string} operator
     * @param {string} foreignKey
     * @returns Query
     * @throws InvalidComparisonOperatorError
     * @description Add a left join to the query.
     */
    leftJoin(table, localKey, operator, foreignKey) {
        Validation.validateComparisonOperator(operator);

        this.#queryJoin.push(new LeftJoin(table, localKey, operator, foreignKey));

        return this;
    }

    /**
     * @param {string} table
     * @returns Query
     * @description Add a "cross join" clause to the query.
     */
    crossJoin(table) {
        this.#queryJoin.push(new CrossJoin(table));

        return this;
    }

    /**
     * @param {{():boolean|string|null|undefined|object|[]|Array<any>}|boolean|string|null|undefined|object|[]|Array<any>} value
     * @param {{(query: Query, value: any)}} callback
     * @param {{(query: Query, value: any)}} [defaultCallback=null]
     * @returns Query
     * @description Apply the callback if the given "value" is (or resolves to) truthy.
     */
    when(value, callback, defaultCallback = null) {
        if (typeof value === "function") {
            value = value();
        }

        if (this.#isValueTruthy(value)) {
            callback(this, value);
        } else {
            defaultCallback ? defaultCallback(this, value) : null;
        }

        return this;
    }

    /**
     * @param {boolean|string|null|undefined|object|[]|Array<any>} value
     * @returns boolean
     */
    #isValueTruthy(value) {
        if (value === null || value === undefined) {
            return false;
        }

        if (typeof value === "boolean") {
            return value;
        }

        if (typeof value === "string") {
            return value.length > 0;
        }

        if (Array.isArray(value)) {
            return value.length > 0;
        }

        if (typeof value === "object") {
            return Object.keys(value).length > 0;
        }

        return false;
    }

    /**
     * @param {string|{(query: WhereCallback)}|Raw} column
     * @param {string|number|null} [operator=null]
     * @param {string|number|null} [value=null]
     * @returns Query
     * @throws InvalidComparisonOperatorError
     * @description Add a basic where clause to the query.
     */
    where(column, operator = null, value = null) {
        if (typeof column === "function") {
            this.#handleWhereCallback(column);
            return this;
        }

        if (column instanceof Raw) {
            this.#queryWhere.push(column.withSeparator(Separator.And));
            return this;
        }

        this.#queryWhere.push(new Where(column, operator, value));

        return this;
    }

    /**
     * @param {string|{(query: WhereCallback)}|Raw} column
     * @param {string|number|null} [operator=null]
     * @param {string|number|null} [value=null]
     * @returns Query
     * @throws InvalidComparisonOperatorError
     * @description Add a basic "where not" clause to the query.
     */
    whereNot(column, operator = null, value = null) {
        if (typeof column === "function") {
            this.#handleWhereCallback(column, Condition.And, true);
            return this;
        }

        if (column instanceof Raw) {
            this.#queryWhere.push(column.withSeparator(Separator.And).prependStatement(Condition.Not));
            return this;
        }

        this.#queryWhere.push(new WhereNot(column, operator, value));

        return this;
    }

    /**
     * @param {string|{(query: WhereCallback)}|Raw} column
     * @param {string|number|null} [operator=null]
     * @param {string|number|null} [value=null]
     * @returns Query
     * @throws InvalidComparisonOperatorError
     * @description Add a basic "or where not" clause to the query.
     */
    orWhereNot(column, operator = null, value = null) {
        if (typeof column === "function") {
            this.#handleWhereCallback(column, Condition.Or, true);
            return this;
        }

        if (column instanceof Raw) {
            this.#queryWhere.push(column.withSeparator(Separator.Or).prependStatement(Condition.Not));
            return this;
        }

        this.#queryWhere.push(new OrWhereNot(column, operator, value));

        return this;
    }

    /**
     * @param {string|{(query: WhereCallback)}|Raw} column
     * @param {string|number|null} [operator=null]
     * @param {string|number|null} [value=null]
     * @returns Query
     * @throws InvalidComparisonOperatorError
     * @description Add an "or where" clause to the query.
     */
    orWhere(column, operator = null, value = null) {
        if (typeof column === "function") {
            this.#handleWhereCallback(column, Separator.Or);
            return this;
        }

        if (column instanceof Raw) {
            this.#queryWhere.push(column.withSeparator(Separator.Or));
            return this;
        }

        this.#queryWhere.push(new OrWhere(column, operator, value));

        return this;
    }

    /**
     * @param {{(query: Query)}|Query} query
     * @returns Query
     * @description Add an exists clause to the query.
     */
    whereExists(query) {
        this.#whereExistsBuilder(query, WhereExists);

        return this;
    }

    /**
     * @param {{(query: Query)}|Query} query
     * @returns Query
     * @description Add an or exists clause to the query.
     */
    orWhereExists(query) {
        this.#whereExistsBuilder(query, OrWhereExists);

        return this;
    }

    /**
     * @param {{(query: Query)}|Query} query
     * @returns Query
     * @description Add a where not exists clause to the query.
     */
    whereNotExists(query) {
        this.#whereExistsBuilder(query, WhereNotExists);

        return this;
    }

    /**
     * @param {{(query: Query)}|Query} query
     * @returns Query
     * @description Add a where not exists clause to the query.
     */
    orWhereNotExists(query) {
        this.#whereExistsBuilder(query, OrWhereNotExists);

        return this;
    }

    /**
     * @param {{(query: Query)}|Query} query
     * @param {Base} baseClass
     */
    #whereExistsBuilder(query, baseClass) {
        let builder = query;

        if (typeof query === "function") {
            builder = query(new Query());
        }

        this.#queryWhere.push(new baseClass(builder));
    }

    /**
     * @param {String} expression
     * @param {Array<String|number>|null} [bindings=null]
     * @returns Query
     * @description Add a raw where clause to the query.
     */
    whereRaw(expression, bindings = null) {
        this.#queryWhere.push(new WhereRaw(expression, bindings));

        return this;
    }

    /**
     * @param {String} expression
     * @param {Array<String|number>|null} [bindings=null]
     * @returns Query
     * @description Add a raw or where clause to the query.
     */
    orWhereRaw(expression, bindings = null) {
        this.#queryWhere.push(new OrWhereRaw(expression, bindings));

        return this;
    }

    /**
     * @param {string} column
     * @returns Query
     * @description Add a "where null" clause to the query.
     */
    whereNull(column) {
        this.#queryWhere.push(new WhereNull(column));

        return this;
    }

    /**
     * @param {string} column
     * @returns Query
     * @description Add an "or where null" clause to the query.
     */
    orWhereNull(column) {
        this.#queryWhere.push(new OrWhereNull(column));

        return this;
    }

    /**
     * @param {string} column
     * @returns Query
     * @description Add a "where not null" clause to the query.
     */
    whereNotNull(column) {
        this.#queryWhere.push(new WhereNotNull(column));

        return this;
    }

    /**
     * @param {string} column
     * @returns Query
     * @description Add an "or where not null" clause to the query.
     */
    orWhereNotNull(column) {
        this.#queryWhere.push(new OrWhereNotNull(column));

        return this;
    }

    /**
     * @param {Array<String>} columns
     * @param {String} operator
     * @param {String|number} value
     * @returns Query
     * @description Add an "where" clause to the query for multiple columns with "or" conditions between them.
     */
    whereAny(columns, operator, value) {
        this.#queryWhere.push(new WhereAny(columns, operator, value));

        return this;
    }

    /**
     * @param {Array<String>} columns
     * @param {String} operator
     * @param {String|number} value
     * @returns Query
     * @description Add a "where" clause to the query for multiple columns with "and" conditions between them.
     */
    whereAll(columns, operator, value) {
        this.#queryWhere.push(new WhereAll(columns, operator, value));

        return this;
    }

    /**
     * @param {Array<String>} columns
     * @param {String} operator
     * @param {String|number} value
     * @returns Query
     * @description Add an "where" clause to the query for multiple columns with "or" conditions between them that don't match the condition
     */
    whereNone(columns, operator, value) {
        this.#queryWhere.push(new WhereNone(columns, operator, value));

        return this;
    }

    /**
     * @param {string} column
     * @param {Array<string|number>} values
     * @returns Query
     * @description Add a "where in" clause to the query.
     */
    whereIn(column, values) {
        this.#queryWhere.push(new WhereIn(column, values));

        return this;
    }

    /**
     * @param {string} column
     * @param {Array<string|number>} values
     * @returns Query
     * @description Add an "or where in" clause to the query.
     */
    orWhereIn(column, values) {
        this.#queryWhere.push(new OrWhereIn(column, values));

        return this;
    }

    /**
     * @param {string} column
     * @param {Array<string|number>} values
     * @returns Query
     * @description Add a "where not in" clause to the query.
     */
    whereNotIn(column, values) {
        this.#queryWhere.push(new WhereNotIn(column, values));

        return this;
    }

    /**
     * @param {string} column
     * @param {Array<string|number>} values
     * @returns Query
     * @description Add an "or where not in" clause to the query.
     */
    orWhereNotIn(column, values) {
        this.#queryWhere.push(new OrWhereNotIn(column, values));

        return this;
    }

    /**
     * @param {string} column
     * @param {Array<string|number>} values
     * @returns Query
     * @throws InvalidBetweenValueArrayLength
     * @description Add a where between statement to the query.
     */
    whereBetween(column, values) {
        Validation.validateBetweenArrayLength(values);

        this.#queryWhere.push(new WhereBetween(column, values));

        return this;
    }

    /**
     * @param {string} column
     * @param {Array<string|number>} values
     * @returns Query
     * @throws InvalidBetweenValueArrayLength
     * @description Add an or where between statement to the query.
     */
    orWhereBetween(column, values) {
        Validation.validateBetweenArrayLength(values);

        this.#queryWhere.push(new OrWhereBetween(column, values));

        return this;
    }

    /**
     * @param {string} column
     * @param {Array<string|number>} values
     * @returns Query
     * @throws InvalidBetweenValueArrayLength
     * @description Add a where not between statement to the query.
     */
    whereNotBetween(column, values) {
        Validation.validateBetweenArrayLength(values);

        this.#queryWhere.push(new WhereNotBetween(column, values));

        return this;
    }

    /**
     * @param {string} column
     * @param {Array<string|number>} values
     * @returns Query
     * @throws InvalidBetweenValueArrayLength
     * @description Add an or where not between statement to the query.
     */
    orWhereNotBetween(column, values) {
        Validation.validateBetweenArrayLength(values);

        this.#queryWhere.push(new OrWhereNotBetween(column, values));

        return this;
    }

    /**
     * @param {string} column
     * @param {string} operator
     * @param {string|null} [comparisonColumn=null]
     * @returns Query
     * @throws InvalidComparisonOperatorError
     * @description Add a "where" clause comparing two columns to the query.
     */
    whereColumn(column, operator, comparisonColumn = null) {
        if (!comparisonColumn) {
            comparisonColumn = operator;
            operator = '=';
        }

        Validation.validateComparisonOperator(operator);

        this.#queryWhere.push(new WhereColumn(column, operator, comparisonColumn));

        return this;
    }

    /**
     * @param {string} column
     * @param {string} operator
     * @param {string|null} [comparisonColumn=null]
     * @returns Query
     * @throws InvalidComparisonOperatorError
     * @description Add an "or where" clause comparing two columns to the query.
     */
    orWhereColumn(column, operator, comparisonColumn = null) {
        if (!comparisonColumn) {
            comparisonColumn = operator;
            operator = '=';
        }

        Validation.validateComparisonOperator(operator);

        this.#queryWhere.push(new OrWhereColumn(column, operator, comparisonColumn));

        return this;
    }

    /**
     * @param {string} column
     * @param {Array<string>} columns
     * @returns Query
     * @throws InvalidBetweenValueArrayLength
     * @description Add a where between statement using columns to the query.
     */
    whereBetweenColumns(column, columns) {
        Validation.validateBetweenArrayLength(columns);

        this.#queryWhere.push(new WhereBetweenColumns(column, columns));

        return this;
    }

    /**
     * @param {string} column
     * @param {Array<string>} columns
     * @returns Query
     * @throws InvalidBetweenValueArrayLength
     * @description Add an or where between statement using columns to the query.
     */
    orWhereBetweenColumns(column, columns) {
        Validation.validateBetweenArrayLength(columns);

        this.#queryWhere.push(new OrWhereBetweenColumns(column, columns));

        return this;
    }

    /**
     * @param {string} column
     * @param {Array<string>} columns
     * @returns Query
     * @throws InvalidBetweenValueArrayLength
     * @description Add a where not between statement using columns to the query.
     */
    whereNotBetweenColumns(column, columns) {
        Validation.validateBetweenArrayLength(columns);

        this.#queryWhere.push(new WhereNotBetweenColumns(column, columns));

        return this;
    }

    /**
     * @param {string} column
     * @param {Array<string>} columns
     * @returns Query
     * @throws InvalidBetweenValueArrayLength
     * @description Add an or where not between statement using columns to the query.
     */
    orWhereNotBetweenColumns(column, columns) {
        Validation.validateBetweenArrayLength(columns);

        this.#queryWhere.push(new OrWhereNotBetweenColumns(column, columns));

        return this;
    }

    /**
     * @param {...string|Raw} columns
     * @returns Query
     * @description Add a "group by" clause to the query.
     */
    groupBy(...columns) {
        columns.forEach((column) => {
            if (column instanceof Raw) {
                this.#queryGroupBy.push(column.withSeparator(Separator.Comma));
            } else {
                this.#queryGroupBy.push(new GroupBy(column));
            }
        });

        return this;
    }

    /**
     * @param {string} expression
     * @returns Query
     * @description Add a raw groupBy clause to the query.
     */
    groupByRaw(expression) {
        this.#queryGroupBy.push(new GroupByRaw(expression));

        return this;
    }

    /**
     * @param {string|{(query: HavingCallback)}|Raw} column
     * @param {string|number} operator
     * @param {string|number|null} [value=null]
     * @returns Query
     * @throws InvalidComparisonOperatorError
     * @description Add a "having" clause to the query.
     */
    having(column, operator, value = null) {
        if (typeof column === "function") {
            this.#handleHavingCallback(column);
            return this;
        }

        if (column instanceof Raw) {
            this.#queryHaving.push(column.withSeparator(Separator.And));
            return this;
        }

        if (!value) {
            value = operator;
            operator = '=';
        }

        Validation.validateComparisonOperator(operator);

        this.#queryHaving.push(new Having(column, operator, value));

        return this;
    }

    /**
     * @param {string|{(query: HavingCallback)}|Raw} column
     * @param {string|number} operator
     * @param {string|number|null} [value=null]
     * @returns Query
     * @throws InvalidComparisonOperatorError
     * @description Add an "or having" clause to the query.
     */
    orHaving(column, operator, value = null) {
        if (typeof column === "function") {
            this.#handleHavingCallback(column, "OR");
            return this;
        }

        if (column instanceof Raw) {
            this.#queryHaving.push(column.withSeparator(Separator.Or));
            return this;
        }

        if (!value) {
            value = operator;
            operator = '=';
        }

        Validation.validateComparisonOperator(operator);

        this.#queryHaving.push(new OrHaving(column, operator, value));

        return this;
    }

    /**
     * @param {string} expression
     * @param {Array<String|Number>|null} [bindings=null]
     * @returns Query
     * @description Add a raw having clause to the query.
     */
    havingRaw(expression, bindings = null) {
        this.#queryHaving.push(new HavingRaw(expression, bindings));

        return this;
    }

    /**
     * @param {string} expression
     * @param {Array<String|Number>|null} [bindings=null]
     * @returns Query
     * @description Add a raw or having clause to the query.
     */
    orHavingRaw(expression, bindings = null) {
        this.#queryHaving.push(new OrHavingRaw(expression, bindings));

        return this;
    }

    /**
     * @param {string} column
     * @param {Array<String|Number>} values
     * @returns Query
     * @throws InvalidBetweenValueArrayLength
     * @description Add a "having between " clause to the query.
     */
    havingBetween(column, values) {
        Validation.validateBetweenArrayLength(values);

        this.#queryHaving.push(new HavingBetween(column, values));

        return this;
    }

    /**
     * @param {string} column
     * @param {Array<String|Number>} values
     * @returns Query
     * @throws InvalidBetweenValueArrayLength
     * @description Add an or "having between " clause to the query.
     */
    orHavingBetween(column, values) {
        Validation.validateBetweenArrayLength(values);

        this.#queryHaving.push(new OrHavingBetween(column, values));

        return this;
    }

    /**
     * @param {string|Raw} column
     * @param {"ASC"|"DESC"} [order=ASC]
     * @returns Query
     * @description Add an "order by" clause to the query.
     */
    orderBy(column, order = "ASC") {
        if (column instanceof Raw) {
            this.#queryOrderBy.push(column.withSeparator(Separator.Comma).appendStatement(order));
            return this;
        }

        this.#queryOrderBy.push(new OrderBy(column, order));
        return this;
    }

    /**
     * @param {string|Raw} column
     * @returns Query
     * @description Add a descending "order by" clause to the query.
     */
    orderByDesc(column) {
        if (column instanceof Raw) {
            this.#queryOrderBy.push(column.withSeparator(Separator.Comma).appendStatement("DESC"));
            return this;
        }

        this.#queryOrderBy.push(new OrderByDesc(column));
        return this;
    }

    /**
     * @param {string} expression
     * @returns Query
     * @description Add a raw "order by" clause to the query.
     */
    orderByRaw(expression) {
        this.#queryOrderBy.push(new Raw(expression).withSeparator(Separator.Comma));
        return this;
    }

    /**
     * @param {number} number
     * @returns Query
     * @description Set the "limit" value of the query.
     */
    limit(number) {
        this.#limit.push(new Limit(number));
        return this;
    }

    /**
     * @param {number} number
     * @returns Query
     * @description Set the "offset" value of the query.
     */
    offset(number) {
        this.#offset.push(new Offset(number));
        return this;
    }

    /**
     * @param {{(query: WhereCallback)}} callback
     * @param {"AND"|"OR"} [condition="AND"]
     * @param {boolean} [not=false]
     * @returns void
     */
    #handleWhereCallback(callback, condition = Condition.And, not = false) {
        const group = new Group(condition, not ? Condition.Not : null);
        const whereCallback = new WhereCallback(group);

        callback(whereCallback);

        this.#queryWhere.push(group);
    }

    /**
     * @param {{(query: HavingCallback)}} callback
     * @param {"AND"|"OR"} [condition="AND"]
     * @returns void
     */
    #handleHavingCallback(callback, condition = Condition.And) {
        const group = new Group(condition);
        const whereCallback = new HavingCallback(group);

        callback(whereCallback);

        this.#queryHaving.push(group);
    }

    /**
     * @param {Record<string, any>} fields
     * @returns string
     */
    #buildInsertSqlQuery(fields) {
        let columns = [];
        let values = [];

        for (const [column, value] of Object.entries(fields)) {
            columns.push(column);
            values.push(value);
        }

        return "INSERT INTO " + this.#table + " (" + columns.join(', ') +
            ") VALUES (" + Utility.valuesToString(values) + ")";
    }

    /**
     * @param {Record<string, any>} fields
     * @returns {Object}
     */
    #buildPreparedInsertSqlQuery(fields) {
        let columns = [];
        let values = [];

        for (const [column, value] of Object.entries(fields)) {
            columns.push(column);
            values.push(value);
        }

        const query = "INSERT INTO " + this.#queryFrom.toggleWithStatement(false).toString()
            + " (" + columns.join(', ') +
            ") VALUES (" + Array(values.length).fill('?').join(', ') + ")";

        return {
            query,
            bindings: values
        }
    }

    /**
     * @returns string
     */
    #buildFullUpdateSqlQuery(fields) {
        const queries = [
            this.#buildPartialUpdateSqlQuery(fields), this.#queryWhere.toString(),
            this.#queryOrderBy.toString(), this.#limit.toString(),
        ];

        return this.#joinQueryStrings(queries)
    }

    /**
     * @returns PrepareObject
     */
    #buildFullUpdatePrepareObject(fields) {
        const queries = [
            this.#buildPartialUpdatePrepareObject(fields), this.#queryWhere.prepare(),
            this.#queryOrderBy.prepare(), this.#limit.prepare(),
        ];

        return this.#joinPrepareObjects(queries)
    }

    /**
     * @returns PrepareObject
     */
    #buildPartialUpdatePrepareObject(fields) {
        let pairs = [];
        let bindings = [];

        for (const [column, value] of Object.entries(fields)) {
            pairs.push(`${column} = ?`);
            bindings.push(value);
        }

        const query = "UPDATE " + this.#queryFrom.toggleWithStatement(false).toString()
            + " SET " + pairs.join(', ');

        return {
            query, bindings
        };
    }

    /**
     * @returns string
     */
    #buildPartialUpdateSqlQuery(fields) {
        let pairs = [];

        for (const [column, value] of Object.entries(fields)) {
            pairs.push(`${column} = ${Utility.valuesToString([value])}`)
        }

        return "UPDATE " + this.#queryFrom.toggleWithStatement(false).toString()
            + " SET " + pairs.join(', ');
    }

    /**
     * @returns string
     */
    #buildFullDeleteSqlQuery() {
        const queryDelete = this.#buildPartialDeleteSqlQuery();

        const queries = [
            queryDelete, this.#queryWhere.toString(),
            this.#queryOrderBy.toString(), this.#limit.toString(),
        ];

        return this.#joinQueryStrings(queries)
    }

    /**
     * @returns PrepareObject
     */
    #buildFullDeletePrepareObject() {
        const queries = [
            this.#buildPartialDeletePrepareObject(), this.#queryWhere.prepare(),
            this.#queryOrderBy.prepare(), this.#limit.prepare(),
        ];

        return this.#joinPrepareObjects(queries)
    }

    #buildPartialDeletePrepareObject() {
        const query = "DELETE FROM " + this.#queryFrom
            .toggleWithStatement(false)
            .toString();

        const bindings = [];

        return {query, bindings};
    }

    #buildPartialDeleteSqlQuery() {
        return "DELETE FROM " + this.#table;
    }

    /**
     * @returns PrepareObject|string
     */
    #buildSelectQuery() {
        const queryCollection = [
            this.#querySelect, this.#queryFrom,
            this.#queryJoin, this.#queryWhere,
            this.#queryGroupBy, this.#queryHaving,
            this.#queryOrderBy, this.#limit,
            this.#offset,
        ];

        const queries = queryCollection.map((query) => {
            if (this.#toSql) {
                return query.toString();
            }

            return query.prepare();
        });

        if (this.#toSql) {
            return this.#joinQueryStrings(queries);
        }

        return this.#joinPrepareObjects(queries);
    }

    /**
     * @param {Array<PrepareObject>} queries
     * @returns PrepareObject
     */
    #joinPrepareObjects(queries) {
        const query = this.#joinQueryStrings(queries.map(query => query.query));

        const bindings = queries.reduce((accumulator, query) => {
            return [...accumulator, ...query.bindings];
        }, []);

        return {query, bindings};
    }

    /**
     * @param {Array<string>} queries
     * @returns string
     */
    #joinQueryStrings(queries) {
        return queries
            .reduce((result, queryString, index) => {
                return result += queryString !== "" ? (index > 0 ? ' ' : '') + queryString : ''
            }, "");
    }

    /**
     * @throws TableNotSetError
     */
    #validateTableSet() {
        if (!this.#table) {
            throw new TableNotSetError("Query Builder");
        }
    }
}