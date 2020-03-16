define(function () {
    'use strict';
    function isFunction(value) {
        return typeof value === 'function';
    }
    function isNumber(value) {
        return typeof value === 'number';
    }
    function isObject(value) {
        return typeof value === 'object';
    }
    function isString(value) {
        return typeof value === 'string';
    }
    function isUndefined(value) {
        return value === undefined;
    }
    return {
        isFunction: isFunction,
        isNumber: isNumber,
        isObject: isObject,
        isString: isString,
        isUndefined: isUndefined
    };
});