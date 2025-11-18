/**
 * @typedef {Object} Condition
 * @property {'BETWEEN'} Between
 * @property {'NOT BETWEEN'} NotBetween
 * @property {'AND'} And
 * @property {'OR'} Or
 * @property {'IS NULL'} Null
 * @property {'IS NOT NULL'} NotNull
 * @property {'IN'} In
 * @property {'NOT IN'} NotIn
 * @property {'EXISTS'} Exists
 * @property {'NOT EXISTS'} NotExists
 * @property {'NOT'} Not
 */

/** @type Condition **/
const Condition = {
    Between: 'BETWEEN',
    NotBetween: 'NOT BETWEEN',
    And: 'AND',
    Or: 'OR',
    Null: 'IS NULL',
    NotNull: 'IS NOT NULL',
    In: 'IN',
    NotIn: 'NOT IN',
    Exists: 'EXISTS',
    NotExists: 'NOT EXISTS',
    Not: 'NOT'
}

export default Condition;