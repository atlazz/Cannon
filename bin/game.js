if (typeof wx!=="undefined") {
	require("weapp-adapter.js");
	require("libs/laya.wxmini.js");
	require('libs/ald-game.js')
}
window.loadLib = require;
require("index.js");