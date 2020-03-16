define([
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