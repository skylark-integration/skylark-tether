define(['./type-check'], function (typecheck) {
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