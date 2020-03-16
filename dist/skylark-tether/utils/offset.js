/**
 * skylark-tether - A version of tether that ported to running on skylarkjs ui.
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-tether/
 * @license MIT
 */
define(["./type-check"],function(t){"use strict";const e={center:"center",left:"right",right:"left"},o={middle:"middle",top:"bottom",bottom:"top"},f={top:0,left:0,middle:"50%",center:"50%",bottom:"100%",right:"100%"};return{addOffset:function(...e){const o={top:0,left:0};return e.forEach(({top:e,left:f})=>{t.isString(e)&&(e=parseFloat(e)),t.isString(f)&&(f=parseFloat(f)),o.top+=e,o.left+=f}),o},attachmentToOffset:function(e){let{left:o,top:n}=e;return t.isUndefined(f[e.left])||(o=f[e.left]),t.isUndefined(f[e.top])||(n=f[e.top]),{left:o,top:n}},autoToFixedAttachment:function(t,f){let{left:n,top:i}=t;return"auto"===n&&(n=e[f.left]),"auto"===i&&(i=o[f.top]),{left:n,top:i}},offsetToPx:function(e,o){return t.isString(e.left)&&-1!==e.left.indexOf("%")&&(e.left=parseFloat(e.left)/100*o.width),t.isString(e.top)&&-1!==e.top.indexOf("%")&&(e.top=parseFloat(e.top)/100*o.height),e},parseTopLeft:function(t){const[e,o]=t.split(" ");return{top:e,left:o}}}});
//# sourceMappingURL=../sourcemaps/utils/offset.js.map
