define(['./type-check'], function (typecheck) {
    'use strict';
    function addClass(el, name) {
        name.split(' ').forEach(cls => {
            if (cls.trim()) {
                el.classList.add(cls);
            }
        });
    }
    function getClass(key = '', classes, classPrefix) {
        if (!typecheck.isUndefined(classes) && !typecheck.isUndefined(classes[key])) {
            if (classes[key] === false) {
                return '';
            }
            return classes[key];
        } else if (classPrefix) {
            return `${ classPrefix }-${ key }`;
        } else {
            return key;
        }
    }
    function removeClass(el, name) {
        name.split(' ').forEach(cls => {
            if (cls.trim()) {
                el.classList.remove(cls);
            }
        });
    }
    function updateClasses(el, add, all) {
        all.forEach(cls => {
            if (add.indexOf(cls) === -1 && el.classList.contains(cls)) {
                removeClass(el, cls);
            }
        });
        add.forEach(cls => {
            if (!el.classList.contains(cls)) {
                addClass(el, cls);
            }
        });
    }
    return {
        addClass: addClass,
        getClass: getClass,
        removeClass: removeClass,
        updateClasses: updateClasses
    };
});