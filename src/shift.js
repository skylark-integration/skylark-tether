define(['./utils/type-check'], function (typecheck) {
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