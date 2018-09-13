'use strict';

const m = require('mithril');
require('./pageslider.styl');


const PageSlider = {};

PageSlider.oninit = function(vn) {
	vn.state.current = vn.attrs.current || 0;
	vn.state.model = vn.attrs.model || {};
	vn.state.height = vn.attrs.height;
};

function updateHeight(vn, mode) {
	var newHeight = Math.max.apply(Math,
		vn.children.map(function(child) {
			return child.dom.offsetHeight;
		}));
	if (newHeight && newHeight !== vn.state.height) {
		vn.state.height = newHeight;
		setTimeout(function() {m.redraw();});
	}
}


PageSlider.oncreate = function(vn) {
	updateHeight(vn, 'create');
};
PageSlider.onupdate = function(vn) {
	updateHeight(vn, 'update');
};

PageSlider.view = function(vn) {
	return m('.pageslider', {style: {height: vn.state.height+'px'}},
		vn.children.map(function(child,index) {
			return m('.pageslider-page'
				+(vn.attrs.showall?'.showall':'')
				+(vn.attrs.current===index?'.active':'')
				+(vn.attrs.current>index?'.back':'')
				+(vn.attrs.current<index?'.next':'')
				, {}, child);
		})
	);
};

PageSlider.Example = {};
PageSlider.Example.model = {};
PageSlider.Example.model.index = 0;
PageSlider.Example.model.showall = false;
PageSlider.Example.view = function() {
	const Layout = require('./mdc/layout');
	const TabBar = require('./mdc/tabbar');
	const Checkbox = require('./mdc/checkbox');
	return m(Layout, [
		m('h2', 'Page Slider'),
		m(Checkbox, {
			id: 'showallmode',
			label: 'Showall mode',
			checked: PageSlider.Example.model.showall,
			onchange: function(ev) {PageSlider.Example.model.showall = ev.target.checked; },
		}),
		m(TabBar, {
			index: PageSlider.Example.model.index,
			onactivated: function(ev) {
                PageSlider.Example.model.index = ev.detail.index;
            },
			align: 'expand',
			tabs: [{
				id: 'sliderpage1',
				text: 'Page 1',
			},{
				id: 'sliderpage2',
				text: 'Page 2',
			},{
				id: 'sliderpage3',
				text: 'Page 3',
			}]
		}),
		m(PageSlider, {
			current: PageSlider.Example.model.index,
			showall: PageSlider.Example.model.showall,
			height: 100,
		}, [
			m('h1', {style: 'background-color: red;'}, 'Page 1'),
			m('',[
				m('h1', {style: 'background-color: green;'}, 'Page 2'),
				m('h1', {style: 'background-color: green;'}, 'Longer'),
				m('h1', {style: 'background-color: green;'}, 'Longer'),
			]),
			m('h1', {style: 'background-color: blue;'}, 'Page 3'),
		]),
	]);
		
};



module.exports=PageSlider;
