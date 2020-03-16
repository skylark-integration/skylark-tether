/**
 * skylark-tether - A version of tether that ported to running on skylarkjs ui.
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-tether/
 * @license MIT
 */
define(["./utils/classes","./utils/deferred","./utils/bounds"],function(t,s,e){"use strict";return{position({top:a,left:h}){const{height:i,width:l}=this.cache("element-bounds",()=>e.getBounds(this.element)),o=this.getTargetBounds(),d=a+i,u=h+l,n=[];a<=o.bottom&&d>=o.top&&["left","right"].forEach(t=>{const s=o[t];s!==h&&s!==u||n.push(t)}),h<=o.right&&u>=o.left&&["top","bottom"].forEach(t=>{const s=o[t];s!==a&&s!==d||n.push(t)});const{classes:r,classPrefix:c}=this.options;return this.all.push(t.getClass("abutted",r,c)),["left","top","right","bottom"].forEach(s=>{this.all.push(`${t.getClass("abutted",r,c)}-${s}`)}),n.length&&this.add.push(t.getClass("abutted",r,c)),n.forEach(s=>{this.add.push(`${t.getClass("abutted",r,c)}-${s}`)}),s.defer(()=>{!1!==this.options.addTargetClasses&&t.updateClasses(this.target,this.add,this.all),t.updateClasses(this.element,this.add,this.all)}),!0}}});
//# sourceMappingURL=sourcemaps/abutment.js.map
