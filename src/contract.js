'use strict';
var m = require('mithril');
var _ = require('./translate');
var css = require('./style.styl');
var Wizard = require('./wizard');
var Layout = require('./mdc/layout');
var Row = Layout.Row;
var Cell = Layout.Cell;
var Button = require('./mdc/button');
var Select = require('./mdc/select');
var Checkbox = require('./mdc/checkbox');
var TextField = require('./mdc/textfield');
var ValidatedField = require('./validatedfield');
var StateCityChooser = require('./statecity');
var LanguageChooser = require('./languagechooser');
var FarePower = require('./farepower');
require('font-awesome/css/font-awesome.css');
require('@material/typography/dist/mdc.typography.css').default;
var Mousetrap = require('mousetrap');
require('mousetrap-global-bind');

var showall = false;

Mousetrap.bindGlobal('ctrl+y', function() {
	showall = !showall;
	m.redraw();
	console.log('showall', showall);
	return false;
});



var Contract = {
	holder: {
		vat: { data: {}},
		privacypolicyaccepted: false,
		isphisical: function() {
			if (this.vat===undefined) return undefined;
			if (this.vat.value===undefined) return undefined;
			var firstchar = this.vat.value[0];
			return '0123456789KLMXYZ'.indexOf(firstchar) !== -1;
		},
		validate: function() {
			var self = this;
			function error(message) {
				if (self.error !== message) {
					console.log(message);
					self.error = message;
				}
				return false;
			}
			if (!this.vat.isvalid) {
				return error('NO_NIF');
			}
			this.usertype = this.isphisical()?'person':'company';

			// TODO: Obsolete
			if (this.usertype === undefined) {
				return error('NO_PERSON_TYPE');
			}
			if (!this.name) {
				return error('NO_NAME');
			}
			if (this.usertype === 'person') {
				if (!this.surname) {
					return error('NO_SURNAME');
				}
			}
			// TODO:  This is not implemented yet
			if (this.usertype === 'company') {
				if (this.representantname === undefined) {
					return error('NO_PROXY_NAME');
				}
				if (this.representantdni === undefined ||
					this.dniRepresentantIsInvalid !== false) {
					return error('NO_PROXY_NIF');
				}
			}
			if (!this.address) {
				return error('NO_ADDRESS');
			}
			if (!this.postalcode || this.postalcodeError) {
				return error('NO_POSTALCODE');
			}
			if (this.state === undefined) {
				return error('NO_STATE');
			}
			if (this.city === undefined) {
				return error('NO_CITY');
			}

			if (!this.email || this.emailError) {
				return error('NO_EMAIL');
			}
			if (!this.email2 || this.email !== this.email2) {
				return error('NO_REPEATED_EMAIL');
			}
			if (!this.phone1) {
				return error('NO_PHONE');
			}
			if (this.language === undefined) {
				return error('NO_LANGUAGE');
			}
			if (this.privacypolicyaccepted !== true) {
				return error('UNACCEPTED_PRIVACY_POLICY');
			}
			this.error = undefined;
			return true;
		},
	},

	postdata: function() {
		return {
		};
	},
};

Mousetrap.bindGlobal('ctrl+shift+1', function() {
	Contract.holder.vat.value = '12345678z';
	Contract.holder.vat.isvalid = true;
	Contract.holder.name='Perico';
	Contract.holder.surname='Palotes';
	Contract.holder.address='Percebe 13';
	Contract.holder.postalcode='12345';
	Contract.holder.phone1='123456789';
	Contract.holder.phone2='987654321';
	Contract.holder.email ='a@a';
	Contract.holder.email2='a@a';
	m.redraw();
	return false;
});
Mousetrap.bindGlobal('ctrl+shift+d', function() {
	var inspector = document.querySelector('.inspector');
	inspector.classList.toggle('shown');
	return false;
});


var Form = {};
Form.view = function(vn) {
	return [
		m('.inspector',
			m('pre', JSON.stringify(Contract, null, 2))),
		m('.main', [
		m(Wizard, {
			showall: showall,
		}, [
			IntroPage(),
			HolderPage(),
			SupplyPage(),
			TermsPage(),
			PaymentPage(),
			ReviewPage(),
		]),
		]),
	];
};

var IntroPage = function() {
	return m('.page', {
		id: 'intro',
		title: _('Intro'),
		next: 'holder',
	},[ m(Row, m(Cell, {span:12},
		m('.intro',_('CONTRACT_INTRO')),
	))]);
};


var HolderPage = function() {
	var holder = Contract.holder;
	var passwordRequired = (
		holder.vat.isvalid===true &&
		holder.vat.exists===true &&
		true);
		
	var detailsRequired = (
		holder.vat.isvalid===true && 
		holder.vat.exists!==true &&
		true);
		
	return m('.page', {
		id: 'holder',
		title: _('Holder'),
		next: 'supply',
		prev: 'intro',
		validator: function() {
			holder.validate();
			return holder.error;
		},
	},[

		m(Row, [
			m(Cell, {span:4}, m(ValidatedField, {
				id: 'vat',
				checkurl: '/check/vat/',
				label: _('NIF'),
				boxed: true,
				required: true,
				maxlength: 9,
				fieldData: holder.vat,
				inputfilter: function(value) {
					if (!value) return value;
					value=value.toUpperCase();
					value=value.replace(/[^0-9A-Z]/g,'');
					return value.slice(0,9);
				},
				onvalidated: function() {
					holder.vat.exists=true;
				}
			})),
			m(Cell, {hidden: !passwordRequired, span:4}, m(TextField, {
				label: _('Password'),
				leadingfaicon: 'key',
				type: 'password',
				boxed: true,
			})),
			m(Cell, {hidden: !passwordRequired, span:4}, m(Button, {
				unelevated: true,
			},_('Login'))),
		]),
		detailsRequired || true? [
			m(Row, [
				m(Cell, {span:5}, m(TextField, {
					id: 'name',
					label: _('Name'),
					value: holder.name,
					oninput: function(ev) {
						holder.name = ev.target.value;
					},
					required: true,
					boxed: true,
				})),
				holder.isphisical()?
					m(Cell, {span:7}, m(TextField, {
						id: 'suname',
						label: _('Surname'),
						value: holder.surname,
						oninput: function(ev) {
							holder.surname = ev.target.value;
						},
						required: true,
						boxed: true,
					}))
				:'',
			]),
			m(Row, [
				m(Cell, {span:8}, m(TextField, {
					id: 'address',
					label: _('Street address'),
					leadingfaicon: 'home',
					value: holder.address,
					oninput: function(ev) {
						holder.address = ev.target.value;
					},
					required: true,
					boxed: true,
					
				})),
				m(Cell, {span:4}, m(TextField, {
					id: 'postalcode',
					label: _('Postal code'),
					value: holder.postalcode,
					maxlength: 5,
					minlength: 5,
					pattern: '[0-9]{5}',
					oninput: function(ev) {
						holder.postalcode = ev.target.value;
						holder.postalcodeError = ev.target.validationMessage;
					},
					inputfilter: function(value) {
						value = value.replace(/[^0-9]/,'');
						value = value.slice(0,5);
						return value;
					},
					help: m.trust('&nbsp;'),
					required: true,
					boxed: true,
					
				})),
			]),
			m(StateCityChooser, {
				onvaluechanged: function(chooser) {
					holder.state = chooser.states.find(function(v) {
						return v.id==chooser.state;
					});
					holder.city = chooser.cities.find(function(v) {
						return v.id==chooser.city;
					});
				},
			}),
			m(Row, [
				m(Cell, {span:6}, m(TextField, {
					id: 'email',
					label: _('e-mail'),
					type: 'email',
					leadingfaicon: 'envelope',
					value: holder.email,
					oninput: function(ev) {
						holder.email = ev.target.value;
						holder.emailError = ev.target.validationMessage;
						// TODO var emailRE = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
					},
					help: _('This address will identify you'),
					boxed: true,
				})),
				m(Cell, {span:6}, m(TextField, {
					id: 'email2',
					label: _('e-mail (repeat)'),
					type: 'email',
					leadingfaicon: 'envelope',
					value: holder.email2,
					oninput: function(ev) {
						holder.email2 = ev.target.value;
					},
					help: _('Repeat the e-mail address to be sure'),
					boxed: true,
				})),
			]),
			m(Row, [
				m(Cell, {span:6}, m(TextField, {
					id: 'phone1',
					label: _('Phone'),
					maxlength: 9,
					leadingfaicon: 'phone',
					value: holder.phone1,
					oninput: function(ev) {
						holder.phone1 = ev.target.value;
					},
					inputfilter: function(value) {
						value = value.replace(/[^0-9]/g,'');
						return value;
					},
					required: true,
					boxed: true,
					
				})),
				m(Cell, {span:6}, m(TextField, {
					id: 'phone2',
					label: _('Additional phone (optional)'),
					maxlength: 9,
					leadingfaicon: 'phone',
					value: holder.phone2,
					oninput: function(ev) {
						holder.phone2 = ev.target.value;
					},
					inputfilter: function(value) {
						value = value.replace(/[^0-9]/g,'');
						return value;
					},
					boxed: true,
					
				})),
			]),
			m(LanguageChooser, {
				id: 'lang',
				onvaluechanged: function(chooser) {
					holder.language = chooser.languages.find(function(v) {
						return v.code==chooser.language;
					});
				},
				help: _('Choose the language we will address you'),
				required: true,
			}),
			m(Row, [
				m(Cell, {span:12}, m(Checkbox, {
					id: 'privacypolicy',
					label: m.trust(_('ACCEPT_PRIVACY_POLICY', {
						url: _('ACCEPT_PRIVACY_POLICY_URL')})),
					checked: holder.privacypolicyaccepted,
					onchange: function(ev) {
						holder.privacypolicyaccepted = ev.target.checked;
					},
					required: true,
				})),
			]),
		]:'',

	]);
};

var SupplyPage = function() {
	return m('.page', {
		id: 'supply',
		title: _('Supply'),
		next: 'terms',
		prev: 'holder',
	},[
	]);
};

var TermsPage = function() {
	return m('.page', {
		id: 'terms',
		title: _('Terms'),
		next: 'payment',
		prev: 'supply',
	},[
	]);
};

var PaymentPage = function() {
	return m('.page', {
		id: 'payment',
		title: _('Payment'),
		next: 'review',
		prev: 'terms',
	},[
	]);
};

var ReviewPage = function() {
	return m('.page', {
		id: 'review',
		title: _('Review'),
		prev: 'payment',
	},[
	]);
};



window.onload = function() {
	var element = document.getElementById("mithril-target");
	m.mount(element, Form);
};
// vim: noet ts=4 sw=4
