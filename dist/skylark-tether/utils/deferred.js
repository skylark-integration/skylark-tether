/**
 * skylark-tether - A version of tether that ported to running on skylarkjs ui.
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-tether/
 * @license MIT
 */
define(function(){"use strict";const n=[];return{defer:function(t){n.push(t)},flush:function(){let t;for(;t=n.pop();)t()}}});
//# sourceMappingURL=../sourcemaps/utils/deferred.js.map
