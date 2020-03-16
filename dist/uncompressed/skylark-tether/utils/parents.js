define(['./type-check'], function (typecheck) {
    'use strict';
    function getScrollParents(el) {
        const computedStyle = getComputedStyle(el) || {};
        const {position} = computedStyle;
        let parents = [];
        if (position === 'fixed') {
            return [el];
        }
        let parent = el;
        while ((parent = parent.parentNode) && parent && parent.nodeType === 1) {
            let style;
            try {
                style = getComputedStyle(parent);
            } catch (err) {
            }
            if (typecheck.isUndefined(style) || style === null) {
                parents.push(parent);
                return parents;
            }
            const {overflow, overflowX, overflowY} = style;
            if (/(auto|scroll|overlay)/.test(overflow + overflowY + overflowX)) {
                if (position !== 'absolute' || [
                        'relative',
                        'absolute',
                        'fixed'
                    ].indexOf(style.position) >= 0) {
                    parents.push(parent);
                }
            }
        }
        parents.push(el.ownerDocument.body);
        if (el.ownerDocument !== document) {
            parents.push(el.ownerDocument.defaultView);
        }
        return parents;
    }
    function getOffsetParent(el) {
        return el.offsetParent || document.documentElement;
    }
    return {
        getScrollParents: getScrollParents,
        getOffsetParent: getOffsetParent
    };
});