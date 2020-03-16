/**
 * skylark-tether - A version of tether that ported to running on skylarkjs ui.
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-tether/
 * @license MIT
 */
define(["./utils/type-check"],function(t){"use strict";return{position({top:i,left:s}){if(!this.options.shift)return;let e,o,{shift:n}=this.options;return t.isFunction(n)&&(n=n.call(this,{top:i,left:s})),t.isString(n)?((n=n.split(" "))[1]=n[1]||n[0],[e,o]=n,e=parseFloat(e,10),o=parseFloat(o,10)):[e,o]=[n.top,n.left],{top:i+=e,left:s+=o}}}});
//# sourceMappingURL=sourcemaps/shift.js.map
