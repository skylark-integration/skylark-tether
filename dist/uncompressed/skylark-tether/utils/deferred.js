define(function () {
    'use strict';
    const deferred = [];
    function defer(fn) {
        deferred.push(fn);
    }
    function flush() {
        let fn;
        while (fn = deferred.pop()) {
            fn();
        }
    }
    return {
        defer: defer,
        flush: flush
    };
});