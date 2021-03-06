'use strict';
var m = require('mithril');
var _ = require('./translate');
var Layout = require('./mdc/layout');
var Row = Layout.Row;
var Cell = Layout.Cell;
var Button = require('./mdc/button');
var Select = require('./mdc/select');
var Checkbox = require('./mdc/checkbox');
var TextField = require('./mdc/textfield');
var ValidatedField = require('./validatedfield');
var LanguageChooser = require('./languagechooser');
var UserValidator = require('./uservalidator');
require('@material/elevation/dist/mdc.elevation.css');

/** @module */

/**
@class
*/
var IntroContract = {};


/* states */
const checkingSession     = 'checkingSession';
const welcomeExistingSession = 'welcomeExistingSession';
const askDni              = 'askDni';

IntroContract.oninit = function(vn) {
	vn.state.model = vn.attrs.model || {};
	var model = vn.state.model;

	vn.state.state = checkingSession;
	UserValidator.isSessionOpen().then(function (data) {
		console.log('checked session open');
		vn.state.state = welcomeExistingSession;
		model.vatvalue = data.nif;
		model.vatvalid = true;
		model.vatexists = true;
		model.name = data.name;
		model.sessionActive = true; // TODO: maybe a session cookie?
		m.redraw();
	}, function (reason) {
		console.log('no session')
		vn.state.state = askDni;
	});

	vn.state.vateditor = {data: {}};

	model.isphisical = function() {
		if (vn.state.vateditor===undefined) return undefined;
		if (vn.state.vateditor.value===undefined) return undefined;
		var firstchar = vn.state.vateditor.value[0];
		return '0123456789KLMXYZ'.indexOf(firstchar) !== -1;
	};
	model.validationErrors = function() {
		if (vn.state.state === checkingSession) {
			return _('STILL_VALIDATING_SESSION'); // TODO: Translate
		}
		if (vn.state.state === welcomeExistingSession) {
			return undefined;
		}
		if (vn.state.vateditor.isvalid === false) {
			return _('NO_NIF');
		}
		if (vn.state.vateditor.isvalid === undefined) {
			return "";
		}
		return undefined;
	};
};

IntroContract.view = function(vn) {
	return m(Row, [
		vn.state.state === checkingSession ? [
			m(Cell, {span:12}, [
				m('', _('VALIDATING_SESSION')),
			])
		] : (
		vn.state.state === welcomeExistingSession ?  [
			m(Cell, {span:12}, [
				m('', _('CONTRACTING_AS', vn.state.model)),
				m('', m.trust(_('NOT_YOU_LOGOUT', {url:'TODO'}))),
			]),
		] : (
		vn.state.state === askDni ? [
			m(Cell, {span:12}, _('FILL_VAT')),
			m(Cell, {span:6}, m(ValidatedField, {
				id: 'vat',
				checkurl: '/check/vat/exists/',
				label: _('VAT_LABEL'),
				help: m('a', {
					href: _('VAT_HELP_URL'),
					target: '_blank'
					}, _('VAT_HELP')),
				boxed: true,
				required: true,
				maxlength: 9,
				fieldData: vn.state.vateditor,
				inputfilter: function(value) {
					if (!value) return value;
					value=value.toUpperCase();
					value=value.replace(/[^0-9A-Z]/g,'');
					return value.slice(0,9);
				},
				onvalidated: function(value, data) {
					if (value) {
						vn.state.model.vatvalue = value;
						vn.state.model.vatvalid = data.valid;
						vn.state.model.vatexists = data.exists;
					} else {
						vn.state.model.vatvalue = undefined;
						vn.state.model.vatvalid = false;
						vn.state.model.vatexists = false;
					}
				}
			})),
		] :
		m('', vn.state.state)
		)),
	]);
};

module.exports = IntroContract;

// vim: noet ts=4 sw=4
