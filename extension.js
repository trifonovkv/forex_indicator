const St = imports.gi.St;
const Main = imports.ui.main;
const Soup = imports.gi.Soup;
const Lang = imports.lang;
const Mainloop=imports.mainloop;
const Clutter=imports.gi.Clutter;
const PanelMenu=imports.ui.panelMenu;
const PopupMenu=imports.ui.popupMenu;
//const Util = imports.misc.util;
const Gettext = imports.gettext.domain('gnome-shell-extensions');
const _ = Gettext.gettext;

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

const QUOTES_URL = 'http://quotes.instaforex.com/get_quotes.php';
const UP_POINTING = String.fromCharCode(9650);
const DOWN_POINTING = String.fromCharCode(9660);

const Quote = new Lang.Class({
	Name: 		'Quote',
	symbol:		null,
	ask:		0.0,
	bid:		0.0,
	change: 	0.0,
	digits:		0,
	lasttime:	0,
	pair:		null,

	load_quote: function(callback) {
		let params = {m: 'json', q: null};
		params.q=this.pair;
		const _httpSession = new Soup.Session();
  		let message = Soup.form_request_new_from_hash('GET', QUOTES_URL, params);
		_httpSession.queue_message(message, Lang.bind(this, function(_httpSession, message) { 
         	let json = JSON.parse(message.response_body.data);
            for (let i in json) {
				current_quote.symbol = json[i].symbol;
				current_quote.ask = json[i].ask;
				current_quote.bid = json[i].bid;
				current_quote.change = json[i].change;
				current_quote.digits = json[i].digits;
				current_quote.lasttime = json[i].lastime;				
			}
			callback();					
		}));
	},
});

const ForexIndicator = new Lang.Class({
	Name: 'ForexIndicator',
	Extends: PanelMenu.Button,
 	buttonText: null,
	timeout: null,
	change_timeout_loop: false,
	
	_init: function() {
		this.parent(0.0,"Forex Indicator",false);
		this.buttonText=new St.Label({
         	name: "forex-indicator-buttonText",
			text: _("Loading..."),
         	y_align: Clutter.ActorAlign.CENTER
     	});
		
		current_quote = new Quote;		
	
		this.actor.add_actor(this.buttonText);
		this.actor.connect('button-press-event', Lang.bind(this, this.refresh));
//      	this.actor.connect('key-press-event', Lang.bind(this, this.refresh));

		for (let i=0; i < SYMBOLS.length; i++) {
	    	let symbol = SYMBOLS[i];
	    	let item = new PopupMenu.PopupMenuItem(SYMBOLS[i]);
	    	item.connect('activate', Lang.bind(this, function(){
				current_quote.pair = symbol;
				this.refresh();
	    	}));
	    	this.menu.addMenuItem(item);
		}		

		let item = new PopupMenu.PopupSeparatorMenuItem();
        this.menu.addMenuItem(item);
		
//		let item = new PopupMenu.PopupMenuItem(_("Settings"));
//        item.connect('activate', Lang.bind(this, this._onPreferencesActivate));
//		this.menu.addMenuItem(item);

		let item = new PopupMenu.PopupMenuItem(_("Offline"));
        item.connect('activate', Lang.bind(this, function(){
			this.offline();
		}));
		this.menu.addMenuItem(item);
		
		this.change_timeoutloop=true;
		this.refresh();
	},

	refresh: function() {
		current_quote.load_quote(Lang.bind(this, function() {			
			let txt;
			if( current_quote.change > 0 )
				txt = UP_POINTING + ' ' + current_quote.bid;
			else
				txt = DOWN_POINTING + ' ' + current_quote.bid;			
			this.buttonText.set_text(txt);
		}));
    	if(this.change_timeoutloop) {
			this.remove_timeout();
			this.timeout = Mainloop.timeout_add_seconds(30, Lang.bind(this, this.refresh));
         	this.change_timeoutloop = false;
         	return false;
      	}
      	return true;
   	},

	offline: function() {
		this.remove_timeout();
		this.buttonText.set_text(_("Offline"));
	},
	
//	_onPreferencesActivate: function() {
//        Util.spawn(["gnome-shell-extension-prefs", "forex_indicator@trifonovkv.gmail.com"]);
//        return 0;
//    },	
	
	remove_timeout: function() {
    	if(this.timeout) {
         	Mainloop.source_remove(this.timeout);
         	this.timeout=null;
      	}
   	},
	
	destroy: function(){
		this.remove_timeout();
		this.parent();		
	},

});

function init() {
}

function enable() {	
	forex_indicator_object = new ForexIndicator;
	if(forex_indicator_object) {
		Main.panel.addToStatusArea('forex-indicator',forex_indicator_object);
   }
}

// Disable function
function disable() {
   if(forex_indicator_object) {
      forex_indicator_object.destroy();
      forex_indicator_object=null;
   }
}
