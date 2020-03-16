/**
 * skylark-tether - A version of tether that ported to running on skylarkjs ui.
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-tether/
 * @license MIT
 */
define(function(){"use strict";let e=null;function t(e={}){const t=[];return Array.prototype.push.apply(t,arguments),t.slice(1).forEach(t=>{if(t)for(let n in t)({}).hasOwnProperty.call(t,n)&&(e[n]=t[n])}),e}return{extend:t,getScrollBarSize:function(){if(e)return e;const n=document.createElement("div");n.style.width="100%",n.style.height="200px";const i=document.createElement("div");t(i.style,{position:"absolute",top:0,left:0,pointerEvents:"none",visibility:"hidden",width:"200px",height:"150px",overflow:"hidden"}),i.appendChild(n),document.body.appendChild(i);const o=n.offsetWidth;i.style.overflow="scroll";let l=n.offsetWidth;o===l&&(l=i.clientWidth),document.body.removeChild(i);const r=o-l;return e={width:r,height:r}},uniqueId:(()=>{let e=0;return()=>++e})()}});
//# sourceMappingURL=../sourcemaps/utils/general.js.map
