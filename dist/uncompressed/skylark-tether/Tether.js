define([
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