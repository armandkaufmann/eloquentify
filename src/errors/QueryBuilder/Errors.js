export class TableNotSetError extends Error {
    /**
     * @param {string|null} [provider='Default']
     * */
    constructor(provider = 'Default') {
        let message = `\nAttempting to generate/execute a query without having set the table on ${provider}.`
        message += `\nPlease ensure that you are setting the table property of the QueryBuilder Class.`;

        super(message);
        this.name = "TableNotSetError";
    }
}

export class InvalidComparisonOperatorError extends Error {
    constructor(operator) {
        let message = `\nAttempting to build a query with an invalid comparison operator: ${operator}.`
        message += `\nPlease ensure that a valid operator is used with the QueryBuilder:`;
        message += `\n\t==, =, !=, <>, >, <, >=, <=, !<, !>`;

        super(message);
        this.name = "InvalidComparisonOperatorError";
    }
}

export class InvalidBetweenValueArrayLength extends Error {
    constructor(length) {
        let message = `\nAttempting to pass an argument to a function that expects an array length of 2, with a length of: ${length}.`
        message += `\nPlease ensure that the proper number of array elements are being passed.`;

        super(message);
        this.name = "InvalidBetweenValueArrayLength";
    }
}

export class MissingRequiredArgument extends Error {
    constructor(classReference, method) {
        const message = `\nAttempting to call a method with missing arguments: ${classReference}.${method}`;

        super(message);
        this.name = "MissingRequiredArgument";
    }
}