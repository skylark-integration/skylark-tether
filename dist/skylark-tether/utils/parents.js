/**
 * skylark-tether - A version of tether that ported to running on skylarkjs ui.
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-tether/
 * @license MIT
 */
define(["./type-check"],function(e){"use strict";return{getScrollParents:function(t){const o=getComputedStyle(t)||{},{position:n}=o;let r=[];if("fixed"===n)return[t];let u=t;for(;(u=u.parentNode)&&u&&1===u.nodeType;){let t;try{t=getComputedStyle(u)}catch(e){}if(e.isUndefined(t)||null===t)return r.push(u),r;const{overflow:o,overflowX:l,overflowY:f}=t;/(auto|scroll|overlay)/.test(o+f+l)&&("absolute"!==n||["relative","absolute","fixed"].indexOf(t.position)>=0)&&r.push(u)}return r.push(t.ownerDocument.body),t.ownerDocument!==document&&r.push(t.ownerDocument.defaultView),r},getOffsetParent:function(e){return e.offsetParent||document.documentElement}}});
//# sourceMappingURL=../sourcemaps/utils/parents.js.map
