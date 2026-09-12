const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="grid"></div></body></html>', { runScripts: "dangerously" });
global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.navigator = { userAgent: 'node.js' };

const GridStack = require('gridstack').GridStack;
const grid = GridStack.init({ column: 12 }, document.getElementById('grid'));
const el = document.createElement('div');
el.className = 'grid-stack-item';
const widget = grid.makeWidget(el);
console.log("Initial node:", widget.gridstackNode.h, widget.gridstackNode.minH);
grid.update(widget, { minH: 5, h: 5 });
console.log("Updated node:", widget.gridstackNode.h, widget.gridstackNode.minH);
