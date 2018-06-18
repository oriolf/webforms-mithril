'use strict';
var m = require('mithril');
var _ = require('./translate');
var requestSom = require('./somapi').requestSom
var MDCTextField = require('@material/textfield');
require('@material/textfield/dist/mdc.textfield.css');
require('@material/ripple');
require('@material/ripple/dist/mdc.ripple.css');
require('@material/floating-label');
require('@material/floating-label/dist/mdc.floating-label.css');

var mdcAutoInit = require('@material/auto-init').default;
mdcAutoInit.register('MDCTextField', MDCTextField.MDCTextField);

var ValidatedInput = {
	oninit: function(vnode) {
		//console.debug(vnode.attrs.id, ': init ', vnode.state, vnode.attrs);
		vnode.state.value = vnode.attrs.value;
		vnode.state.isvalid = vnode.attrs.checkurl===undefined;
		vnode.state.errormessage = undefined;
		vnode.state._lastPromise = undefined;
		//console.debug(vnode.attrs.id, ': after init ', vnode.state, vnode.attrs);
	},
	oncreate: function(vnode) {
		//this.mdcinstance = new MDCTextField.MDCTextField(vnode.dom);
	},
	view: function (vnode) {
		const help_id = vnode.attrs.id+'_help';
		const statusIcons = {
			empty:  '',
			missing:'.fa.fa-asterisk.red',
			ok:     '.fa.fa-check.green',
			ko:     '.fa.fa-exclamation-triangle.red',
			wait:   '.fa.fa-refresh.fa-spin.orange',
		};
		const statusColors = {
			empty:  '',
			missing:'.red',
			ok:     '.green',
			ko:     '.red',
			wait:   '.orange',
		};
		const statusMessages = {
			empty:  '',
			missing:_('Required'),
			ok:     vnode.attrs.checkurl?_('Correct'):'',
			ko:     _('Invalid'),
			wait:   _('Checking...'),
		};

		var iconState = (vnode.state.value===undefined)? (vnode.attrs.required!==undefined?'missing':'empty') : (
			vnode.state.isvalid===undefined?'wait':vnode.state.isvalid===false?'ko':'ok');
		//console.debug(vnode.attrs.id, ': Updating view ', vnode.state, vnode.attrs);
		//console.debug(vnode.attrs.id, iconState);

		var statusIcon = statusIcons[iconState] || '';
		var statusColor = statusColors[iconState] || '';
		var statusMessage = statusMessages[iconState] || '';

		function validateInput(ev) {
			//console.debug(vnode.attrs.id, ' oninput',ev);

			function fielderror(message) {
				//console.debug(vnode.attrs.id, ' rejecting ', vnode.state);
				vnode.dom.firstChild.MDCTextField.valid = false;
				vnode.state.isvalid = false;
				vnode.state.errormessage = message;
				ev.target.setCustomValidity(message);
				//console.debug(vnode.attrs.id, ' rejected ', vnode.state);
			}
			function acceptValue(newValue) {
				//console.debug(vnode.attrs.id, "Accepting:", newValue);
				vnode.dom.firstChild.MDCTextField.valid = true;
				vnode.state.isvalid = true;
				vnode.state.errormessage = undefined;
				ev.target.setCustomValidity(undefined);
				vnode.attrs.onChange && vnode.attrs.onChange(newValue);
				//console.debug(vnode.attrs.id, "Accepted:", vnode.attrs);
			}
			function waitValue(newValue) {
				vnode.dom.firstChild.MDCTextField.valid = true;
				ev.target.setCustomValidity(undefined);
				vnode.state.value = newValue;
				vnode.state.isvalid = undefined; // status checking
				vnode.state.errormessage = undefined;
			}

			var newValue = ev.target.value;
			if (newValue === '') { newValue = undefined; }
			waitValue(newValue);
			if (newValue === undefined) {
				if (vnode.attrs.required !== undefined) {
					return fielderror(_('Required'));
				}
				return acceptValue(newValue);
			}
			if (vnode.attrs.checkurl === undefined) {
				return acceptValue(newValue); 
			}
			if (vnode.state._lastPromise!==undefined) {
				vnode.state._lastPromise.abort();
			}
			// TODO: abortar darrera promesa
			var promise = requestSom(vnode.attrs.checkurl+newValue);
			vnode.state._lastPromise=promise;
			promise.value = newValue;
			promise.then(function(result) {
				if (promise.value != vnode.state.value) {
					console.log('Antigua request '+promise.value);
					return; // value changed while waiting, ignore
				}
				if (result.state === false) {
					fielderror(vnode.attrs.defaulterror || _('Invalid value'));
				}
				else {
					fielderror(undefined);
					acceptValue(newValue); 
				}
				if (result.data !== undefined) {
					vnode.state.data = result.data;
					if (result.data.invalid_fields !== undefined) {
						fielderror(result.data.invalid_fields[0].error);
					}
				}
			}).catch(function(reason) {
				fielderror(reason || _('Unknown'));
			});
			//console.debug('oninput end',vnode.attrs);
		};

		return m('.mdc-form-field', [
			m(''
				+'.mdc-text-field'
				+(vnode.attrs.fullwidth?'.mdc-text-field--fullwidth':'')
				+'.mdc-text-field--with-trailing-icon'
				+(vnode.attrs.fullwidth?'':'.mdc-text-field--box')
				+(vnode.attrs.disabled?'mdc-text-field--disabled':'')
			,{
				'data-mdc-auto-init': 'MDCTextField',
				style: { width: '100%'},
			},[
				m('input[type=text]'+
					'.mdc-text-field__input'+
					'',
				{
					pattern: vnode.attrs.pattern,
					id: vnode.attrs.id,
					value: vnode.state.value,
					disabled: vnode.attrs.disabled,
					required: vnode.attrs.required,
					onchange: validateInput,
					oninput: validateInput,
					'aria-controls': help_id,
					'aria-describedby': help_id,
				}, [
				]),
				vnode.attrs.fullwidth?'':m('label'
					+'.mdc-floating-label',
					{'for': vnode.attrs.id}, [
					vnode.attrs.label,
				]),
				m('.mdc-line-ripple'),
				vnode.attrs.fullwidth?[]:
					m('.mdc-text-field__icon.red', {
						}, [
							m('i'+statusIcon,''),
						]),
			]),
			m('.mdc-text-field-helper-text'+
				'.mdc-text-field-helper-text--persistent'+
				'.mdc-text-field-helper-text--validation-msg'+
				statusColor+
				'', {
				id: help_id,
				'aria-hidden': true,
				},
				vnode.state.errormessage || statusMessage || vnode.attrs.help
			),
		]);
	},
};


module.exports = ValidatedInput

// vim: noet ts=4 sw=4
