/**
 * skylark-tether - A version of tether that ported to running on skylarkjs ui.
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-tether/
 * @license MIT
 */
define(["./type-check"],function(s){"use strict";function i(s,i){i.split(" ").forEach(i=>{i.trim()&&s.classList.add(i)})}function n(s,i){i.split(" ").forEach(i=>{i.trim()&&s.classList.remove(i)})}return{addClass:i,getClass:function(i="",n,t){return s.isUndefined(n)||s.isUndefined(n[i])?t?`${t}-${i}`:i:!1===n[i]?"":n[i]},removeClass:n,updateClasses:function(s,t,e){e.forEach(i=>{-1===t.indexOf(i)&&s.classList.contains(i)&&n(s,i)}),t.forEach(n=>{s.classList.contains(n)||i(s,n)})}}});
//# sourceMappingURL=../sourcemaps/utils/classes.js.map
