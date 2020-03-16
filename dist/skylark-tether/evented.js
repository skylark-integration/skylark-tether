/**
 * skylark-tether - A version of tether that ported to running on skylarkjs ui.
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-tether/
 * @license MIT
 */
define(["./utils/type-check"],function(i){"use strict";return{Evented:class{on(n,s,e,t=!1){return i.isUndefined(this.bindings)&&(this.bindings={}),i.isUndefined(this.bindings[n])&&(this.bindings[n]=[]),this.bindings[n].push({handler:s,ctx:e,once:t}),this}once(i,n,s){return this.on(i,n,s,!0)}off(n,s){return i.isUndefined(this.bindings)||i.isUndefined(this.bindings[n])?this:(i.isUndefined(s)?delete this.bindings[n]:this.bindings[n].forEach((i,e)=>{i.handler===s&&this.bindings[n].splice(e,1)}),this)}trigger(n,...s){return!i.isUndefined(this.bindings)&&this.bindings[n]&&this.bindings[n].forEach((i,e)=>{const{ctx:t,handler:d,once:h}=i,r=t||this;d.apply(r,s),h&&this.bindings[n].splice(e,1)}),this}}}});
//# sourceMappingURL=sourcemaps/evented.js.map
