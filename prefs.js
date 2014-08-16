const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;

const Gettext = imports.gettext.domain('gnome-shell-extension-forexindicator');
const _ = Gettext.gettext;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;
const Lang = imports.lang;

const FOREX_SETTINGS_SCHEMA = 'org.gnome.shell.extensions.forexindicator';
const FOREX_PAIR_CURRENT = 'pair-current';
const FOREX_REFRESH_INTERVAL = 'refresh-interval';
const FOREX_PRICE_IN_PANEL = 'price-in-panel';

const SYMBOLS = [ 
	'EURUSD', 
	'GBPUSD', 
	'USDJPY', 
	'USDCHF', 
	'USDCAD', 
	'EURJPY',
	'EURCHF',
	'GBPJPY',
	'GBPCHF',
	'GOLD'
];

function init() {
    Convenience.initTranslations('gnome-shell-extension-forexindicator');
}

const ForexPrefsWidget = new GObject.Class({
    Name: 'ForexIndicatorExtension.Prefs.Widget',
    GTypeName: 'ForexIndicatorExtensionPrefsWidget',
    Extends: Gtk.Grid,

    _init: function(params) {
		this._loadConfig();
		
		this.parent(params);
    	this.margin = 12;
    	this.row_spacing = this.column_spacing = 6;
    	this.set_orientation(Gtk.Orientation.VERTICAL);

		this.add(new Gtk.Label({ label: '<b>' + _("Price in panel") + '</b>',
                                 use_markup: true,
                                 halign: Gtk.Align.START }));
		let hbox = new Gtk.HBox();		
		let vbox = new Gtk.VBox();
		let radio = new Gtk.RadioButton();
		let button = Gtk.RadioButton.new_with_label_from_widget(radio, _("Ask"),
													{halign: Gtk.Align.CENTER});       
		button.connect("toggled", Lang.bind(this, function(){
				this._priceInPanel = "Ask";
		})); 
		if (button.label == this._priceInPanel)
				button.set_active(true);
		vbox.add(button);

		let button = Gtk.RadioButton.new_with_label_from_widget(radio, _("Bid"),
													{halign: Gtk.Align.CENTER});       
		button.connect("toggled", Lang.bind(this, function(){
				this._priceInPanel = "Bid";
		})); 
		if (button.label == this._priceInPanel)
				button.set_active(true);
		vbox.add(button);

		hbox.add(vbox);	
		
		let vbox = new Gtk.VBox();
        let label = new Gtk.Label({ label: _("Time Update"),
                                    hexpand: true,
									halign: Gtk.Align.CENTER});
		vbox.add(label);
		let ad = new Gtk.Adjustment({ lower: 1.0,
								  	  step_increment: 1.0,
								  	  upper: 360.0,
								  	  value: 1.0});
		let spinButton = new Gtk.SpinButton({ adjustment: ad,
											  digits: 0,
								  			  xalign: 1,
											  halign: Gtk.Align.CENTER});
		spinButton.set_value(this._refreshInterval);
		spinButton.connect("value_changed", Lang.bind(this, function(){
			this._refreshInterval = spinButton.value;
		}));
		vbox.add(spinButton);
		hbox.add(vbox);
		this.add(hbox);

		this.add(new Gtk.Label({ label: '<b>' + _("Symbols") + '</b>',
                                 use_markup: true,
                                 halign: Gtk.Align.START }));
		let hbox = new Gtk.HBox();		
		let vbox = new Gtk.VBox();
		let radio = new Gtk.RadioButton();
		for (let i=0; i < SYMBOLS.length; i++) {
	    	let button = Gtk.RadioButton.new_with_label_from_widget(radio, SYMBOLS[i],
																	{halign: Gtk.Align.CENTER});       
			let symbol = SYMBOLS[i];
			button.connect("toggled", Lang.bind(this, function(){
				this._currentPair = symbol;
			})); 
			if (button.label == this._currentPair)
				button.set_active(true);
			if(i % 3 == 0) {
				hbox.add(vbox);
				vbox = new Gtk.VBox();
			}	
			vbox.add(button);
		}
		hbox.add(vbox);	
		this.add(hbox);				
    },

	_loadConfig: function() {
        this._settings = Convenience.getSettings(FOREX_SETTINGS_SCHEMA);
	},

	get _currentPair() {
       	if (!this._settings)
           	this._loadConfig();
       	return this._settings.get_string(FOREX_PAIR_CURRENT);
    },		

	set _currentPair(v) {
        if (!this._settings)
            this._loadConfig();
        this._settings.set_string(FOREX_PAIR_CURRENT, v);
    },

	get _refreshInterval() {
       	if (!this._settings)
           	this._loadConfig();
       	return this._settings.get_int(FOREX_REFRESH_INTERVAL);
    },		

	set _refreshInterval(v) {
        if (!this._settings)
            this._loadConfig();
        this._settings.set_int(FOREX_REFRESH_INTERVAL, v);
    },

	get _priceInPanel() {
       	if (!this._settings)
           	this._loadConfig();
       	return this._settings.get_string(FOREX_PRICE_IN_PANEL);
    },		

	set _priceInPanel(v) {
        if (!this._settings)
            this._loadConfig();
        this._settings.set_string(FOREX_PRICE_IN_PANEL, v);
    },
});

function buildPrefsWidget() {
    let widget = new ForexPrefsWidget();
    widget.show_all();
    return widget;
}


