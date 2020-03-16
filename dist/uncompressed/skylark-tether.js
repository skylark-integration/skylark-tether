/**
 * skylark-tether - A version of tether that ported to running on skylarkjs ui.
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-tether/
 * @license MIT
 */
(function(factory,globals) {
  var define = globals.define,
      require = globals.require,
      isAmd = (typeof define === 'function' && define.amd),
      isCmd = (!isAmd && typeof exports !== 'undefined');

  if (!isAmd && !define) {
    var map = {};
    function absolute(relative, base) {
        if (relative[0]!==".") {
          return relative;
        }
        var stack = base.split("/"),
            parts = relative.split("/");
        stack.pop(); 
        for (var i=0; i<parts.length; i++) {
            if (parts[i] == ".")
                continue;
            if (parts[i] == "..")
                stack.pop();
            else
                stack.push(parts[i]);
        }
        return stack.join("/");
    }
    define = globals.define = function(id, deps, factory) {
        if (typeof factory == 'function') {
            map[id] = {
                factory: factory,
                deps: deps.map(function(dep){
                  return absolute(dep,id);
                }),
                resolved: false,
                exports: null
            };
            require(id);
        } else {
            map[id] = {
                factory : null,
                resolved : true,
                exports : factory
            };
        }
    };
    require = globals.require = function(id) {
        if (!map.hasOwnProperty(id)) {
            throw new Error('Module ' + id + ' has not been defined');
        }
        var module = map[id];
        if (!module.resolved) {
            var args = [];

            module.deps.forEach(function(dep){
                args.push(require(dep));
            })

            module.exports = module.factory.apply(globals, args) || null;
            module.resolved = true;
        }
        return module.exports;
    };
  }
  
  if (!define) {
     throw new Error("The module utility (ex: requirejs or skylark-utils) is not loaded!");
  }

  factory(define,require);

  if (!isAmd) {
    var skylarkjs = require("skylark-langx/skylark");

    if (isCmd) {
      module.exports = skylarkjs;
    } else {
      globals.skylarkjs  = skylarkjs;
    }
  }

})(function(define,require) {

define('skylark-tether/utils/type-check',[],function () {
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
define('skylark-tether/utils/classes',['./type-check'], function (typecheck) {
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
define('skylark-tether/utils/deferred',[],function () {
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
define('skylark-tether/utils/general',[],function () {
    'use strict';
    let _scrollBarSize = null;
    function extend(out = {}) {
        const args = [];
        Array.prototype.push.apply(args, arguments);
        args.slice(1).forEach(obj => {
            if (obj) {
                for (let key in obj) {
                    if ({}.hasOwnProperty.call(obj, key)) {
                        out[key] = obj[key];
                    }
                }
            }
        });
        return out;
    }
    function getScrollBarSize() {
        if (_scrollBarSize) {
            return _scrollBarSize;
        }
        const inner = document.createElement('div');
        inner.style.width = '100%';
        inner.style.height = '200px';
        const outer = document.createElement('div');
        extend(outer.style, {
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none',
            visibility: 'hidden',
            width: '200px',
            height: '150px',
            overflow: 'hidden'
        });
        outer.appendChild(inner);
        document.body.appendChild(outer);
        const widthContained = inner.offsetWidth;
        outer.style.overflow = 'scroll';
        let widthScroll = inner.offsetWidth;
        if (widthContained === widthScroll) {
            widthScroll = outer.clientWidth;
        }
        document.body.removeChild(outer);
        const width = widthContained - widthScroll;
        _scrollBarSize = {
            width,
            height: width
        };
        return _scrollBarSize;
    }
    const uniqueId = (() => {
        let id = 0;
        return () => ++id;
    })();
    return {
        extend: extend,
        getScrollBarSize: getScrollBarSize,
        uniqueId: uniqueId
    };
});
define('skylark-tether/utils/bounds',[
    './deferred',
    './general',
    './type-check'
], function (deferred, general, typecheck) {
    'use strict';
    const zeroPosCache = {};
    let zeroElement = null;
    function getBounds(body, el) {
        let doc;
        if (el === document) {
            doc = document;
            el = document.documentElement;
        } else {
            doc = el.ownerDocument;
        }
        const docEl = doc.documentElement;
        const box = _getActualBoundingClientRect(el);
        const origin = _getOrigin(body);
        box.top -= origin.top;
        box.left -= origin.left;
        if (typecheck.isUndefined(box.width)) {
            box.width = document.body.scrollWidth - box.left - box.right;
        }
        if (typecheck.isUndefined(box.height)) {
            box.height = document.body.scrollHeight - box.top - box.bottom;
        }
        box.top = box.top - docEl.clientTop;
        box.left = box.left - docEl.clientLeft;
        box.right = doc.body.clientWidth - box.width - box.left;
        box.bottom = doc.body.clientHeight - box.height - box.top;
        return box;
    }
    function getScrollHandleBounds(body, target) {
        let bounds;
        const targetScrollTop = target.scrollTop;
        const targetIsBody = target === document.body;
        if (targetIsBody) {
            target = document.documentElement;
            bounds = {
                left: pageXOffset,
                top: pageYOffset,
                height: innerHeight,
                width: innerWidth
            };
        } else {
            bounds = getBounds(body, target);
        }
        const style = getComputedStyle(target);
        const hasBottomScroll = target.scrollWidth > target.clientWidth || [
            style.overflow,
            style.overflowX
        ].indexOf('scroll') >= 0 || !targetIsBody;
        let scrollBottom = 0;
        if (hasBottomScroll) {
            scrollBottom = 15;
        }
        const height = bounds.height - parseFloat(style.borderTopWidth) - parseFloat(style.borderBottomWidth) - scrollBottom;
        const out = {
            width: 15,
            height: height * 0.975 * (height / target.scrollHeight),
            left: bounds.left + bounds.width - parseFloat(style.borderLeftWidth) - 15
        };
        let fitAdj = 0;
        if (height < 408 && targetIsBody) {
            fitAdj = -0.00011 * Math.pow(height, 2) - 0.00727 * height + 22.58;
        }
        if (!targetIsBody) {
            out.height = Math.max(out.height, 24);
        }
        const scrollPercentage = targetScrollTop / (target.scrollHeight - height);
        out.top = scrollPercentage * (height - out.height - fitAdj) + bounds.top + parseFloat(style.borderTopWidth);
        if (targetIsBody) {
            out.height = Math.max(out.height, 24);
        }
        return out;
    }
    function getVisibleBounds(body, target) {
        if (target === document.body) {
            return {
                top: pageYOffset,
                left: pageXOffset,
                height: innerHeight,
                width: innerWidth
            };
        } else {
            const bounds = getBounds(body, target);
            const out = {
                height: bounds.height,
                width: bounds.width,
                top: bounds.top,
                left: bounds.left
            };
            out.height = Math.min(out.height, bounds.height - (pageYOffset - bounds.top));
            out.height = Math.min(out.height, bounds.height - (bounds.top + bounds.height - (pageYOffset + innerHeight)));
            out.height = Math.min(innerHeight, out.height);
            out.height -= 2;
            out.width = Math.min(out.width, bounds.width - (pageXOffset - bounds.left));
            out.width = Math.min(out.width, bounds.width - (bounds.left + bounds.width - (pageXOffset + innerWidth)));
            out.width = Math.min(innerWidth, out.width);
            out.width -= 2;
            if (out.top < pageYOffset) {
                out.top = pageYOffset;
            }
            if (out.left < pageXOffset) {
                out.left = pageXOffset;
            }
            return out;
        }
    }
    function removeUtilElements(body) {
        if (zeroElement) {
            body.removeChild(zeroElement);
        }
        zeroElement = null;
    }
    function _getActualBoundingClientRect(node) {
        let boundingRect = node.getBoundingClientRect();
        let rect = {};
        for (let k in boundingRect) {
            rect[k] = boundingRect[k];
        }
        try {
            if (node.ownerDocument !== document) {
                let {frameElement} = node.ownerDocument.defaultView;
                if (frameElement) {
                    let frameRect = _getActualBoundingClientRect(frameElement);
                    rect.top += frameRect.top;
                    rect.bottom += frameRect.top;
                    rect.left += frameRect.left;
                    rect.right += frameRect.left;
                }
            }
        } catch (err) {
        }
        return rect;
    }
    function _getOrigin(body) {
        let node = zeroElement;
        if (!node || !body.contains(node)) {
            node = document.createElement('div');
            node.setAttribute('data-tether-id', general.uniqueId());
            general.extend(node.style, {
                top: 0,
                left: 0,
                position: 'absolute'
            });
            body.appendChild(node);
            zeroElement = node;
        }
        const id = node.getAttribute('data-tether-id');
        if (typecheck.isUndefined(zeroPosCache[id])) {
            zeroPosCache[id] = _getActualBoundingClientRect(node);
            deferred.defer(() => {
                delete zeroPosCache[id];
            });
        }
        return zeroPosCache[id];
    }
    return {
        getBounds: getBounds,
        getScrollHandleBounds: getScrollHandleBounds,
        getVisibleBounds: getVisibleBounds,
        removeUtilElements: removeUtilElements
    };
});
define('skylark-tether/abutment',[
    './utils/classes',
    './utils/deferred',
    './utils/bounds'
], function (_classes, deferred, bounds) {
    'use strict';
    return {
        position({top, left}) {
            const {height, width} = this.cache('element-bounds', () => {
                return bounds.getBounds(this.element);
            });
            const targetPos = this.getTargetBounds();
            const bottom = top + height;
            const right = left + width;
            const abutted = [];
            if (top <= targetPos.bottom && bottom >= targetPos.top) {
                [
                    'left',
                    'right'
                ].forEach(side => {
                    const targetPosSide = targetPos[side];
                    if (targetPosSide === left || targetPosSide === right) {
                        abutted.push(side);
                    }
                });
            }
            if (left <= targetPos.right && right >= targetPos.left) {
                [
                    'top',
                    'bottom'
                ].forEach(side => {
                    const targetPosSide = targetPos[side];
                    if (targetPosSide === top || targetPosSide === bottom) {
                        abutted.push(side);
                    }
                });
            }
            const sides = [
                'left',
                'top',
                'right',
                'bottom'
            ];
            const {classes, classPrefix} = this.options;
            this.all.push(_classes.getClass('abutted', classes, classPrefix));
            sides.forEach(side => {
                this.all.push(`${ _classes.getClass('abutted', classes, classPrefix) }-${ side }`);
            });
            if (abutted.length) {
                this.add.push(_classes.getClass('abutted', classes, classPrefix));
            }
            abutted.forEach(side => {
                this.add.push(`${ _classes.getClass('abutted', classes, classPrefix) }-${ side }`);
            });
            deferred.defer(() => {
                if (!(this.options.addTargetClasses === false)) {
                    _classes.updateClasses(this.target, this.add, this.all);
                }
                _classes.updateClasses(this.element, this.add, this.all);
            });
            return true;
        }
    };
});
define('skylark-tether/constraint',[
    './utils/classes',
    './utils/deferred',
    './utils/general',
    './utils/bounds',
    './utils/type-check'
], function (_classes, deferred, general, bounds, typecheck) {
    'use strict';
    const BOUNDS_FORMAT = [
        'left',
        'top',
        'right',
        'bottom'
    ];
    function getBoundingRect(body, tether, to) {
        if (!to) {
            return null;
        }
        if (to === 'scrollParent') {
            to = tether.scrollParents[0];
        } else if (to === 'window') {
            to = [
                pageXOffset,
                pageYOffset,
                innerWidth + pageXOffset,
                innerHeight + pageYOffset
            ];
        }
        if (to === document) {
            to = to.documentElement;
        }
        if (!typecheck.isUndefined(to.nodeType)) {
            const node = to;
            const size = bounds.getBounds(body, to);
            const pos = size;
            const style = getComputedStyle(to);
            to = [
                pos.left,
                pos.top,
                size.width + pos.left,
                size.height + pos.top
            ];
            if (node.ownerDocument !== document) {
                let win = node.ownerDocument.defaultView;
                to[0] += win.pageXOffset;
                to[1] += win.pageYOffset;
                to[2] += win.pageXOffset;
                to[3] += win.pageYOffset;
            }
            BOUNDS_FORMAT.forEach((side, i) => {
                side = side[0].toUpperCase() + side.substr(1);
                if (side === 'Top' || side === 'Left') {
                    to[i] += parseFloat(style[`border${ side }Width`]);
                } else {
                    to[i] -= parseFloat(style[`border${ side }Width`]);
                }
            });
        }
        return to;
    }
    function _addOutOfBoundsClass(oob, addClasses, classes, classPrefix, outOfBoundsClass) {
        if (oob.length) {
            let oobClass;
            if (!typecheck.isUndefined(outOfBoundsClass)) {
                oobClass = outOfBoundsClass;
            } else {
                oobClass = _classes.getClass('out-of-bounds', classes, classPrefix);
            }
            addClasses.push(oobClass);
            oob.forEach(side => {
                addClasses.push(`${ oobClass }-${ side }`);
            });
        }
    }
    function _calculateOOBAndPinnedLeft(left, bounds, width, pin, pinned, oob) {
        if (left < bounds[0]) {
            if (pin.indexOf('left') >= 0) {
                left = bounds[0];
                pinned.push('left');
            } else {
                oob.push('left');
            }
        }
        if (left + width > bounds[2]) {
            if (pin.indexOf('right') >= 0) {
                left = bounds[2] - width;
                pinned.push('right');
            } else {
                oob.push('right');
            }
        }
        return left;
    }
    function _calculateOOBAndPinnedTop(top, bounds, height, pin, pinned, oob) {
        if (top < bounds[1]) {
            if (pin.indexOf('top') >= 0) {
                top = bounds[1];
                pinned.push('top');
            } else {
                oob.push('top');
            }
        }
        if (top + height > bounds[3]) {
            if (pin.indexOf('bottom') >= 0) {
                top = bounds[3] - height;
                pinned.push('bottom');
            } else {
                oob.push('bottom');
            }
        }
        return top;
    }
    function _flipXTogether(tAttachment, eAttachment, bounds, width, targetWidth, left) {
        if (left < bounds[0] && tAttachment.left === 'left') {
            if (eAttachment.left === 'right') {
                left += targetWidth;
                tAttachment.left = 'right';
                left += width;
                eAttachment.left = 'left';
            } else if (eAttachment.left === 'left') {
                left += targetWidth;
                tAttachment.left = 'right';
                left -= width;
                eAttachment.left = 'right';
            }
        } else if (left + width > bounds[2] && tAttachment.left === 'right') {
            if (eAttachment.left === 'left') {
                left -= targetWidth;
                tAttachment.left = 'left';
                left -= width;
                eAttachment.left = 'right';
            } else if (eAttachment.left === 'right') {
                left -= targetWidth;
                tAttachment.left = 'left';
                left += width;
                eAttachment.left = 'left';
            }
        } else if (tAttachment.left === 'center') {
            if (left + width > bounds[2] && eAttachment.left === 'left') {
                left -= width;
                eAttachment.left = 'right';
            } else if (left < bounds[0] && eAttachment.left === 'right') {
                left += width;
                eAttachment.left = 'left';
            }
        }
        return left;
    }
    function _flipYTogether(tAttachment, eAttachment, bounds, height, targetHeight, top) {
        if (tAttachment.top === 'top') {
            if (eAttachment.top === 'bottom' && top < bounds[1]) {
                top += targetHeight;
                tAttachment.top = 'bottom';
                top += height;
                eAttachment.top = 'top';
            } else if (eAttachment.top === 'top' && top + height > bounds[3] && top - (height - targetHeight) >= bounds[1]) {
                top -= height - targetHeight;
                tAttachment.top = 'bottom';
                eAttachment.top = 'bottom';
            }
        }
        if (tAttachment.top === 'bottom') {
            if (eAttachment.top === 'top' && top + height > bounds[3]) {
                top -= targetHeight;
                tAttachment.top = 'top';
                top -= height;
                eAttachment.top = 'bottom';
            } else if (eAttachment.top === 'bottom' && top < bounds[1] && top + (height * 2 - targetHeight) <= bounds[3]) {
                top += height - targetHeight;
                tAttachment.top = 'top';
                eAttachment.top = 'top';
            }
        }
        if (tAttachment.top === 'middle') {
            if (top + height > bounds[3] && eAttachment.top === 'top') {
                top -= height;
                eAttachment.top = 'bottom';
            } else if (top < bounds[1] && eAttachment.top === 'bottom') {
                top += height;
                eAttachment.top = 'top';
            }
        }
        return top;
    }
    function _getAllClasses(classes, classPrefix, constraints) {
        const allClasses = [
            _classes.getClass('pinned', classes, classPrefix),
            _classes.getClass('out-of-bounds', classes, classPrefix)
        ];
        constraints.forEach(constraint => {
            const {outOfBoundsClass, pinnedClass} = constraint;
            if (outOfBoundsClass) {
                allClasses.push(outOfBoundsClass);
            }
            if (pinnedClass) {
                allClasses.push(pinnedClass);
            }
        });
        allClasses.forEach(cls => {
            [
                'left',
                'top',
                'right',
                'bottom'
            ].forEach(side => {
                allClasses.push(`${ cls }-${ side }`);
            });
        });
        return allClasses;
    }
    return {
        position({top, left, targetAttachment}) {
            if (!this.options.constraints) {
                return true;
            }
            let {height, width} = this.cache('element-bounds', () => {
                return bounds.getBounds(this.bodyElement, this.element);
            });
            if (width === 0 && height === 0 && !typecheck.isUndefined(this.lastSize)) {
                ({width, height} = this.lastSize);
            }
            const targetSize = this.cache('target-bounds', () => {
                return this.getTargetBounds();
            });
            const {
                height: targetHeight,
                width: targetWidth
            } = targetSize;
            const {classes, classPrefix} = this.options;
            const allClasses = _getAllClasses(classes, classPrefix, this.options.constraints);
            const addClasses = [];
            const tAttachment = general.extend({}, targetAttachment);
            const eAttachment = general.extend({}, this.attachment);
            this.options.constraints.forEach(constraint => {
                let {to, attachment, pin} = constraint;
                if (typecheck.isUndefined(attachment)) {
                    attachment = '';
                }
                let changeAttachX, changeAttachY;
                if (attachment.indexOf(' ') >= 0) {
                    [changeAttachY, changeAttachX] = attachment.split(' ');
                } else {
                    changeAttachX = changeAttachY = attachment;
                }
                const bounds = getBoundingRect(this.bodyElement, this, to);
                if (changeAttachY === 'target' || changeAttachY === 'both') {
                    if (top < bounds[1] && tAttachment.top === 'top') {
                        top += targetHeight;
                        tAttachment.top = 'bottom';
                    }
                    if (top + height > bounds[3] && tAttachment.top === 'bottom') {
                        top -= targetHeight;
                        tAttachment.top = 'top';
                    }
                }
                if (changeAttachY === 'together') {
                    top = _flipYTogether(tAttachment, eAttachment, bounds, height, targetHeight, top);
                }
                if (changeAttachX === 'target' || changeAttachX === 'both') {
                    if (left < bounds[0] && tAttachment.left === 'left') {
                        left += targetWidth;
                        tAttachment.left = 'right';
                    }
                    if (left + width > bounds[2] && tAttachment.left === 'right') {
                        left -= targetWidth;
                        tAttachment.left = 'left';
                    }
                }
                if (changeAttachX === 'together') {
                    left = _flipXTogether(tAttachment, eAttachment, bounds, width, targetWidth, left);
                }
                if (changeAttachY === 'element' || changeAttachY === 'both') {
                    if (top < bounds[1] && eAttachment.top === 'bottom') {
                        top += height;
                        eAttachment.top = 'top';
                    }
                    if (top + height > bounds[3] && eAttachment.top === 'top') {
                        top -= height;
                        eAttachment.top = 'bottom';
                    }
                }
                if (changeAttachX === 'element' || changeAttachX === 'both') {
                    if (left < bounds[0]) {
                        if (eAttachment.left === 'right') {
                            left += width;
                            eAttachment.left = 'left';
                        } else if (eAttachment.left === 'center') {
                            left += width / 2;
                            eAttachment.left = 'left';
                        }
                    }
                    if (left + width > bounds[2]) {
                        if (eAttachment.left === 'left') {
                            left -= width;
                            eAttachment.left = 'right';
                        } else if (eAttachment.left === 'center') {
                            left -= width / 2;
                            eAttachment.left = 'right';
                        }
                    }
                }
                if (typecheck.isString(pin)) {
                    pin = pin.split(',').map(p => p.trim());
                } else if (pin === true) {
                    pin = [
                        'top',
                        'left',
                        'right',
                        'bottom'
                    ];
                }
                pin = pin || [];
                const pinned = [];
                const oob = [];
                left = _calculateOOBAndPinnedLeft(left, bounds, width, pin, pinned, oob);
                top = _calculateOOBAndPinnedTop(top, bounds, height, pin, pinned, oob);
                if (pinned.length) {
                    let pinnedClass;
                    if (!typecheck.isUndefined(this.options.pinnedClass)) {
                        pinnedClass = this.options.pinnedClass;
                    } else {
                        pinnedClass = _classes.getClass('pinned', classes, classPrefix);
                    }
                    addClasses.push(pinnedClass);
                    pinned.forEach(side => {
                        addClasses.push(`${ pinnedClass }-${ side }`);
                    });
                }
                _addOutOfBoundsClass(oob, addClasses, classes, classPrefix, this.options.outOfBoundsClass);
                if (pinned.indexOf('left') >= 0 || pinned.indexOf('right') >= 0) {
                    eAttachment.left = tAttachment.left = false;
                }
                if (pinned.indexOf('top') >= 0 || pinned.indexOf('bottom') >= 0) {
                    eAttachment.top = tAttachment.top = false;
                }
                if (tAttachment.top !== targetAttachment.top || tAttachment.left !== targetAttachment.left || eAttachment.top !== this.attachment.top || eAttachment.left !== this.attachment.left) {
                    this.updateAttachClasses(eAttachment, tAttachment);
                    this.trigger('update', {
                        attachment: eAttachment,
                        targetAttachment: tAttachment
                    });
                }
            });
            deferred.defer(() => {
                if (!(this.options.addTargetClasses === false)) {
                    _classes.updateClasses(this.target, addClasses, allClasses);
                }
                _classes.updateClasses(this.element, addClasses, allClasses);
            });
            return {
                top,
                left
            };
        }
    };
});
define('skylark-tether/shift',['./utils/type-check'], function (typecheck) {
    'use strict';
    return {
        position({top, left}) {
            if (!this.options.shift) {
                return;
            }
            let {shift} = this.options;
            if (typecheck.isFunction(shift)) {
                shift = shift.call(this, {
                    top,
                    left
                });
            }
            let shiftTop, shiftLeft;
            if (typecheck.isString(shift)) {
                shift = shift.split(' ');
                shift[1] = shift[1] || shift[0];
                [shiftTop, shiftLeft] = shift;
                shiftTop = parseFloat(shiftTop, 10);
                shiftLeft = parseFloat(shiftLeft, 10);
            } else {
                [shiftTop, shiftLeft] = [
                    shift.top,
                    shift.left
                ];
            }
            top += shiftTop;
            left += shiftLeft;
            return {
                top,
                left
            };
        }
    };
});
define('skylark-tether/evented',['./utils/type-check'], function (typecheck) {
    'use strict';
    class Evented {
        on(event, handler, ctx, once = false) {
            if (typecheck.isUndefined(this.bindings)) {
                this.bindings = {};
            }
            if (typecheck.isUndefined(this.bindings[event])) {
                this.bindings[event] = [];
            }
            this.bindings[event].push({
                handler,
                ctx,
                once
            });
            return this;
        }
        once(event, handler, ctx) {
            return this.on(event, handler, ctx, true);
        }
        off(event, handler) {
            if (typecheck.isUndefined(this.bindings) || typecheck.isUndefined(this.bindings[event])) {
                return this;
            }
            if (typecheck.isUndefined(handler)) {
                delete this.bindings[event];
            } else {
                this.bindings[event].forEach((binding, index) => {
                    if (binding.handler === handler) {
                        this.bindings[event].splice(index, 1);
                    }
                });
            }
            return this;
        }
        trigger(event, ...args) {
            if (!typecheck.isUndefined(this.bindings) && this.bindings[event]) {
                this.bindings[event].forEach((binding, index) => {
                    const {ctx, handler, once} = binding;
                    const context = ctx || this;
                    handler.apply(context, args);
                    if (once) {
                        this.bindings[event].splice(index, 1);
                    }
                });
            }
            return this;
        }
    }
    return { Evented: Evented };
});
define('skylark-tether/utils/offset',['./type-check'], function (typecheck) {
    'use strict';
    const MIRROR_LR = {
        center: 'center',
        left: 'right',
        right: 'left'
    };
    const MIRROR_TB = {
        middle: 'middle',
        top: 'bottom',
        bottom: 'top'
    };
    const OFFSET_MAP = {
        top: 0,
        left: 0,
        middle: '50%',
        center: '50%',
        bottom: '100%',
        right: '100%'
    };
    function addOffset(...offsets) {
        const out = {
            top: 0,
            left: 0
        };
        offsets.forEach(({top, left}) => {
            if (typecheck.isString(top)) {
                top = parseFloat(top);
            }
            if (typecheck.isString(left)) {
                left = parseFloat(left);
            }
            out.top += top;
            out.left += left;
        });
        return out;
    }
    function attachmentToOffset(attachment) {
        let {left, top} = attachment;
        if (!typecheck.isUndefined(OFFSET_MAP[attachment.left])) {
            left = OFFSET_MAP[attachment.left];
        }
        if (!typecheck.isUndefined(OFFSET_MAP[attachment.top])) {
            top = OFFSET_MAP[attachment.top];
        }
        return {
            left,
            top
        };
    }
    function autoToFixedAttachment(attachment, relativeToAttachment) {
        let {left, top} = attachment;
        if (left === 'auto') {
            left = MIRROR_LR[relativeToAttachment.left];
        }
        if (top === 'auto') {
            top = MIRROR_TB[relativeToAttachment.top];
        }
        return {
            left,
            top
        };
    }
    function offsetToPx(offset, size) {
        if (typecheck.isString(offset.left) && offset.left.indexOf('%') !== -1) {
            offset.left = parseFloat(offset.left) / 100 * size.width;
        }
        if (typecheck.isString(offset.top) && offset.top.indexOf('%') !== -1) {
            offset.top = parseFloat(offset.top) / 100 * size.height;
        }
        return offset;
    }
    function parseTopLeft(value) {
        const [top, left] = value.split(' ');
        return {
            top,
            left
        };
    }
    return {
        addOffset: addOffset,
        attachmentToOffset: attachmentToOffset,
        autoToFixedAttachment: autoToFixedAttachment,
        offsetToPx: offsetToPx,
        parseTopLeft: parseTopLeft
    };
});
define('skylark-tether/utils/parents',['./type-check'], function (typecheck) {
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
define('skylark-tether/Tether',[
    "skylark-langx/skylark",
    './abutment',
    './constraint',
    './shift',
    './evented',
    './utils/classes',
    './utils/deferred',
    './utils/general',
    './utils/offset',
    './utils/bounds',
    './utils/parents',
    './utils/type-check'
], function (skylark,Abutment, Constraint, Shift, evented, _classes, deferred, general, _offset, bounds, parents, typecheck) {
    'use strict';
    const TetherBase = {
        modules: [
            Constraint,
            Abutment,
            Shift
        ]
    };
    function isFullscreenElement(e) {
        let d = e.ownerDocument;
        let fe = d.fullscreenElement || d.webkitFullscreenElement || d.mozFullScreenElement || d.msFullscreenElement;
        return fe === e;
    }
    function within(a, b, diff = 1) {
        return a + diff >= b && b >= a - diff;
    }
    const transformKey = (() => {
        if (typecheck.isUndefined(document)) {
            return '';
        }
        const el = document.createElement('div');
        const transforms = [
            'transform',
            'WebkitTransform',
            'OTransform',
            'MozTransform',
            'msTransform'
        ];
        for (let i = 0; i < transforms.length; ++i) {
            const key = transforms[i];
            if (el.style[key] !== undefined) {
                return key;
            }
        }
    })();
    const tethers = [];
    const position = () => {
        tethers.forEach(tether => {
            tether.position(false);
        });
        deferred.flush();
    };
    function now() {
        return performance.now();
    }
    (() => {
        let lastCall = null;
        let lastDuration = null;
        let pendingTimeout = null;
        const tick = () => {
            if (!typecheck.isUndefined(lastDuration) && lastDuration > 16) {
                lastDuration = Math.min(lastDuration - 16, 250);
                pendingTimeout = setTimeout(tick, 250);
                return;
            }
            if (!typecheck.isUndefined(lastCall) && now() - lastCall < 10) {
                return;
            }
            if (pendingTimeout != null) {
                clearTimeout(pendingTimeout);
                pendingTimeout = null;
            }
            lastCall = now();
            position();
            lastDuration = now() - lastCall;
        };
        if (!typecheck.isUndefined(window) && !typecheck.isUndefined(window.addEventListener)) {
            [
                'resize',
                'scroll',
                'touchmove'
            ].forEach(event => {
                window.addEventListener(event, tick);
            });
        }
    })();
    class TetherClass extends evented.Evented {
        constructor(options) {
            super();
            this.position = this.position.bind(this);
            tethers.push(this);
            this.history = [];
            this.setOptions(options, false);
            TetherBase.modules.forEach(module => {
                if (!typecheck.isUndefined(module.initialize)) {
                    module.initialize.call(this);
                }
            });
            this.position();
        }
        setOptions(options, pos = true) {
            const defaults = {
                offset: '0 0',
                targetOffset: '0 0',
                targetAttachment: 'auto auto',
                classPrefix: 'tether',
                bodyElement: document.body
            };
            this.options = general.extend(defaults, options);
            let {element, target, targetModifier, bodyElement} = this.options;
            this.element = element;
            this.target = target;
            this.targetModifier = targetModifier;
            if (typeof bodyElement === 'string') {
                bodyElement = document.querySelector(bodyElement);
            }
            this.bodyElement = bodyElement;
            if (this.target === 'viewport') {
                this.target = document.body;
                this.targetModifier = 'visible';
            } else if (this.target === 'scroll-handle') {
                this.target = document.body;
                this.targetModifier = 'scroll-handle';
            }
            [
                'element',
                'target'
            ].forEach(key => {
                if (typecheck.isUndefined(this[key])) {
                    throw new Error('Tether Error: Both element and target must be defined');
                }
                if (!typecheck.isUndefined(this[key].jquery)) {
                    this[key] = this[key][0];
                } else if (typecheck.isString(this[key])) {
                    this[key] = document.querySelector(this[key]);
                }
            });
            this._addClasses();
            if (!this.options.attachment) {
                throw new Error('Tether Error: You must provide an attachment');
            }
            this.targetAttachment = _offset.parseTopLeft(this.options.targetAttachment);
            this.attachment = _offset.parseTopLeft(this.options.attachment);
            this.offset = _offset.parseTopLeft(this.options.offset);
            this.targetOffset = _offset.parseTopLeft(this.options.targetOffset);
            if (!typecheck.isUndefined(this.scrollParents)) {
                this.disable();
            }
            if (this.targetModifier === 'scroll-handle') {
                this.scrollParents = [this.target];
            } else {
                this.scrollParents = parents.getScrollParents(this.target);
            }
            if (!(this.options.enabled === false)) {
                this.enable(pos);
            }
        }
        getTargetBounds() {
            if (!typecheck.isUndefined(this.targetModifier)) {
                if (this.targetModifier === 'visible') {
                    return bounds.getVisibleBounds(this.bodyElement, this.target);
                } else if (this.targetModifier === 'scroll-handle') {
                    return bounds.getScrollHandleBounds(this.bodyElement, this.target);
                }
            } else {
                return bounds.getBounds(this.bodyElement, this.target);
            }
        }
        clearCache() {
            this._cache = {};
        }
        cache(k, getter) {
            if (typecheck.isUndefined(this._cache)) {
                this._cache = {};
            }
            if (typecheck.isUndefined(this._cache[k])) {
                this._cache[k] = getter.call(this);
            }
            return this._cache[k];
        }
        enable(pos = true) {
            const {classes, classPrefix} = this.options;
            if (!(this.options.addTargetClasses === false)) {
                _classes.addClass(this.target, _classes.getClass('enabled', classes, classPrefix));
            }
            _classes.addClass(this.element, _classes.getClass('enabled', classes, classPrefix));
            this.enabled = true;
            this.scrollParents.forEach(parent => {
                if (parent !== this.target.ownerDocument) {
                    parent.addEventListener('scroll', this.position);
                }
            });
            if (pos) {
                this.position();
            }
        }
        disable() {
            const {classes, classPrefix} = this.options;
            _classes.removeClass(this.target, _classes.getClass('enabled', classes, classPrefix));
            _classes.removeClass(this.element, _classes.getClass('enabled', classes, classPrefix));
            this.enabled = false;
            if (!typecheck.isUndefined(this.scrollParents)) {
                this.scrollParents.forEach(parent => {
                    parent.removeEventListener('scroll', this.position);
                });
            }
        }
        destroy() {
            this.disable();
            this._removeClasses();
            tethers.forEach((tether, i) => {
                if (tether === this) {
                    tethers.splice(i, 1);
                }
            });
            if (tethers.length === 0) {
                bounds.removeUtilElements(this.bodyElement);
            }
        }
        updateAttachClasses(elementAttach, targetAttach) {
            elementAttach = elementAttach || this.attachment;
            targetAttach = targetAttach || this.targetAttachment;
            const sides = [
                'left',
                'top',
                'bottom',
                'right',
                'middle',
                'center'
            ];
            const {classes, classPrefix} = this.options;
            if (!typecheck.isUndefined(this._addAttachClasses) && this._addAttachClasses.length) {
                this._addAttachClasses.splice(0, this._addAttachClasses.length);
            }
            if (typecheck.isUndefined(this._addAttachClasses)) {
                this._addAttachClasses = [];
            }
            this.add = this._addAttachClasses;
            if (elementAttach.top) {
                this.add.push(`${ _classes.getClass('element-attached', classes, classPrefix) }-${ elementAttach.top }`);
            }
            if (elementAttach.left) {
                this.add.push(`${ _classes.getClass('element-attached', classes, classPrefix) }-${ elementAttach.left }`);
            }
            if (targetAttach.top) {
                this.add.push(`${ _classes.getClass('target-attached', classes, classPrefix) }-${ targetAttach.top }`);
            }
            if (targetAttach.left) {
                this.add.push(`${ _classes.getClass('target-attached', classes, classPrefix) }-${ targetAttach.left }`);
            }
            this.all = [];
            sides.forEach(side => {
                this.all.push(`${ _classes.getClass('element-attached', classes, classPrefix) }-${ side }`);
                this.all.push(`${ _classes.getClass('target-attached', classes, classPrefix) }-${ side }`);
            });
            deferred.defer(() => {
                if (typecheck.isUndefined(this._addAttachClasses)) {
                    return;
                }
                _classes.updateClasses(this.element, this._addAttachClasses, this.all);
                if (!(this.options.addTargetClasses === false)) {
                    _classes.updateClasses(this.target, this._addAttachClasses, this.all);
                }
                delete this._addAttachClasses;
            });
        }
        position(flushChanges = true) {
            if (!this.enabled) {
                return;
            }
            this.clearCache();
            const targetAttachment = _offset.autoToFixedAttachment(this.targetAttachment, this.attachment);
            this.updateAttachClasses(this.attachment, targetAttachment);
            const elementPos = this.cache('element-bounds', () => {
                return bounds.getBounds(this.bodyElement, this.element);
            });
            let {width, height} = elementPos;
            if (width === 0 && height === 0 && !typecheck.isUndefined(this.lastSize)) {
                ({width, height} = this.lastSize);
            } else {
                this.lastSize = {
                    width,
                    height
                };
            }
            const targetPos = this.cache('target-bounds', () => {
                return this.getTargetBounds();
            });
            const targetSize = targetPos;
            let offset = _offset.offsetToPx(_offset.attachmentToOffset(this.attachment), {
                width,
                height
            });
            let targetOffset = _offset.offsetToPx(_offset.attachmentToOffset(targetAttachment), targetSize);
            const manualOffset = _offset.offsetToPx(this.offset, {
                width,
                height
            });
            const manualTargetOffset = _offset.offsetToPx(this.targetOffset, targetSize);
            offset = _offset.addOffset(offset, manualOffset);
            targetOffset = _offset.addOffset(targetOffset, manualTargetOffset);
            let left = targetPos.left + targetOffset.left - offset.left;
            let top = targetPos.top + targetOffset.top - offset.top;


            let scrollbarSize;

            for (let i = 0; i < TetherBase.modules.length; ++i) {
                const module = TetherBase.modules[i];
                const ret = module.position.call(this, {
                    left,
                    top,
                    targetAttachment,
                    targetPos,
                    elementPos,
                    offset,
                    targetOffset,
                    manualOffset,
                    manualTargetOffset,
                    scrollbarSize,
                    attachment: this.attachment
                });
                if (ret === false) {
                    return false;
                } else if (typecheck.isUndefined(ret) || !typecheck.isObject(ret)) {
                    continue;
                } else {
                    ({top, left} = ret);
                }
            }
            const next = {
                page: {
                    top,
                    left
                },
                viewport: {
                    top: top - pageYOffset,
                    bottom: pageYOffset - top - height + innerHeight,
                    left: left - pageXOffset,
                    right: pageXOffset - left - width + innerWidth
                }
            };
            let doc = this.target.ownerDocument;
            let win = doc.defaultView;
            if (win.innerHeight > doc.documentElement.clientHeight) {
                scrollbarSize = this.cache('scrollbar-size', general.getScrollBarSize);
                next.viewport.bottom -= scrollbarSize.height;
            }
            if (win.innerWidth > doc.documentElement.clientWidth) {
                scrollbarSize = this.cache('scrollbar-size', general.getScrollBarSize);
                next.viewport.right -= scrollbarSize.width;
            }
            if ([
                    '',
                    'static'
                ].indexOf(doc.body.style.position) === -1 || [
                    '',
                    'static'
                ].indexOf(doc.body.parentElement.style.position) === -1) {
                next.page.bottom = doc.body.scrollHeight - top - height;
                next.page.right = doc.body.scrollWidth - left - width;
            }
            if (!typecheck.isUndefined(this.options.optimizations) && this.options.optimizations.moveElement !== false && typecheck.isUndefined(this.targetModifier)) {
                const offsetParent = this.cache('target-offsetparent', () => parents.getOffsetParent(this.target));
                const offsetPosition = this.cache('target-offsetparent-bounds', () => bounds.getBounds(this.bodyElement, offsetParent));
                const offsetParentStyle = getComputedStyle(offsetParent);
                const offsetParentSize = offsetPosition;
                const offsetBorder = {};
                [
                    'Top',
                    'Left',
                    'Bottom',
                    'Right'
                ].forEach(side => {
                    offsetBorder[side.toLowerCase()] = parseFloat(offsetParentStyle[`border${ side }Width`]);
                });
                offsetPosition.right = doc.body.scrollWidth - offsetPosition.left - offsetParentSize.width + offsetBorder.right;
                offsetPosition.bottom = doc.body.scrollHeight - offsetPosition.top - offsetParentSize.height + offsetBorder.bottom;
                if (next.page.top >= offsetPosition.top + offsetBorder.top && next.page.bottom >= offsetPosition.bottom) {
                    if (next.page.left >= offsetPosition.left + offsetBorder.left && next.page.right >= offsetPosition.right) {
                        const {scrollLeft, scrollTop} = offsetParent;
                        next.offset = {
                            top: next.page.top - offsetPosition.top + scrollTop - offsetBorder.top,
                            left: next.page.left - offsetPosition.left + scrollLeft - offsetBorder.left
                        };
                    }
                }
            }
            this.move(next);
            this.history.unshift(next);
            if (this.history.length > 3) {
                this.history.pop();
            }
            if (flushChanges) {
                deferred.flush();
            }
            return true;
        }
        move(pos) {
            if (typecheck.isUndefined(this.element.parentNode)) {
                return;
            }
            const same = {};
            for (let type in pos) {
                same[type] = {};
                for (let key in pos[type]) {
                    let found = false;
                    for (let i = 0; i < this.history.length; ++i) {
                        const point = this.history[i];
                        if (!typecheck.isUndefined(point[type]) && !within(point[type][key], pos[type][key])) {
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        same[type][key] = true;
                    }
                }
            }
            let css = {
                top: '',
                left: '',
                right: '',
                bottom: ''
            };
            const transcribe = (_same, _pos) => {
                const hasOptimizations = !typecheck.isUndefined(this.options.optimizations);
                const gpu = hasOptimizations ? this.options.optimizations.gpu : null;
                if (gpu !== false) {
                    let yPos, xPos;
                    if (_same.top) {
                        css.top = 0;
                        yPos = _pos.top;
                    } else {
                        css.bottom = 0;
                        yPos = -_pos.bottom;
                    }
                    if (_same.left) {
                        css.left = 0;
                        xPos = _pos.left;
                    } else {
                        css.right = 0;
                        xPos = -_pos.right;
                    }
                    if (typecheck.isNumber(window.devicePixelRatio) && devicePixelRatio % 1 === 0) {
                        xPos = Math.round(xPos * devicePixelRatio) / devicePixelRatio;
                        yPos = Math.round(yPos * devicePixelRatio) / devicePixelRatio;
                    }
                    css[transformKey] = `translateX(${ xPos }px) translateY(${ yPos }px)`;
                    if (transformKey !== 'msTransform') {
                        css[transformKey] += ' translateZ(0)';
                    }
                } else {
                    if (_same.top) {
                        css.top = `${ _pos.top }px`;
                    } else {
                        css.bottom = `${ _pos.bottom }px`;
                    }
                    if (_same.left) {
                        css.left = `${ _pos.left }px`;
                    } else {
                        css.right = `${ _pos.right }px`;
                    }
                }
            };
            const hasOptimizations = !typecheck.isUndefined(this.options.optimizations);
            let allowPositionFixed = true;
            if (hasOptimizations && this.options.optimizations.allowPositionFixed === false) {
                allowPositionFixed = false;
            }
            let moved = false;
            if ((same.page.top || same.page.bottom) && (same.page.left || same.page.right)) {
                css.position = 'absolute';
                transcribe(same.page, pos.page);
            } else if (allowPositionFixed && (same.viewport.top || same.viewport.bottom) && (same.viewport.left || same.viewport.right)) {
                css.position = 'fixed';
                transcribe(same.viewport, pos.viewport);
            } else if (!typecheck.isUndefined(same.offset) && same.offset.top && same.offset.left) {
                css.position = 'absolute';
                const offsetParent = this.cache('target-offsetparent', () => parents.getOffsetParent(this.target));
                if (parents.getOffsetParent(this.element) !== offsetParent) {
                    deferred.defer(() => {
                        this.element.parentNode.removeChild(this.element);
                        offsetParent.appendChild(this.element);
                    });
                }
                transcribe(same.offset, pos.offset);
                moved = true;
            } else {
                css.position = 'absolute';
                transcribe({
                    top: true,
                    left: true
                }, pos.page);
            }
            if (!moved) {
                if (this.options.bodyElement) {
                    if (this.element.parentNode !== this.options.bodyElement) {
                        this.options.bodyElement.appendChild(this.element);
                    }
                } else {
                    let offsetParentIsBody = true;
                    let currentNode = this.element.parentNode;
                    while (currentNode && currentNode.nodeType === 1 && currentNode.tagName !== 'BODY' && !isFullscreenElement(currentNode)) {
                        if (getComputedStyle(currentNode).position !== 'static') {
                            offsetParentIsBody = false;
                            break;
                        }
                        currentNode = currentNode.parentNode;
                    }
                    if (!offsetParentIsBody) {
                        this.element.parentNode.removeChild(this.element);
                        this.element.ownerDocument.body.appendChild(this.element);
                    }
                }
            }
            const writeCSS = {};
            let write = false;
            for (let key in css) {
                let val = css[key];
                let elVal = this.element.style[key];
                if (elVal !== val) {
                    write = true;
                    writeCSS[key] = val;
                }
            }
            if (write) {
                deferred.defer(() => {
                    general.extend(this.element.style, writeCSS);
                    this.trigger('repositioned');
                });
            }
        }
        _addClasses() {
            const {classes, classPrefix} = this.options;
            _classes.addClass(this.element, _classes.getClass('element', classes, classPrefix));
            if (!(this.options.addTargetClasses === false)) {
                _classes.addClass(this.target, _classes.getClass('target', classes, classPrefix));
            }
        }
        _removeClasses() {
            const {classes, classPrefix} = this.options;
            _classes.removeClass(this.element, _classes.getClass('element', classes, classPrefix));
            if (!(this.options.addTargetClasses === false)) {
                _classes.removeClass(this.target, _classes.getClass('target', classes, classPrefix));
            }
            this.all.forEach(className => {
                this.element.classList.remove(className);
                this.target.classList.remove(className);
            });
        }
    }
    TetherClass.modules = [];
    TetherBase.position = position;
    let Tether = general.extend(TetherClass, TetherBase);
    Tether.modules.push({
        initialize() {
            const {classes, classPrefix} = this.options;
            this.markers = {};
            [
                'target',
                'element'
            ].forEach(type => {
                const el = document.createElement('div');
                el.className = _classes.getClass(`${ type }-marker`, classes, classPrefix);
                const dot = document.createElement('div');
                dot.className = _classes.getClass('marker-dot', classes, classPrefix);
                el.appendChild(dot);
                this[type].appendChild(el);
                this.markers[type] = {
                    dot,
                    el
                };
            });
        },
        position({manualOffset, manualTargetOffset}) {
            const offsets = {
                element: manualOffset,
                target: manualTargetOffset
            };
            for (let type in offsets) {
                const offset = offsets[type];
                for (let side in offset) {
                    let val = offset[side];
                    if (!typecheck.isString(val) || val.indexOf('%') === -1 && val.indexOf('px') === -1) {
                        val += 'px';
                    }
                    if (this.markers[type].dot.style[side] !== val) {
                        this.markers[type].dot.style[side] = val;
                    }
                }
            }
            return true;
        }
    });
    return skylark.attach("intg.Tether", Tether);
});
define('skylark-tether/main',["./Tether"],function(Tether){
	return Tether;
});
define('skylark-tether', ['skylark-tether/main'], function (main) { return main; });


},this);
//# sourceMappingURL=sourcemaps/skylark-tether.js.map
