define([
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