const St = imports.gi.St;
const Main = imports.ui.main;
const Soup = imports.gi.Soup;
const Lang = imports.lang;
const Mainloop=imports.mainloop;
const Clutter=imports.gi.Clutter;
const PanelMenu=imports.ui.panelMenu;
const PopupMenu=imports.ui.popupMenu;

let url = 'http://quotes.instaforex.com/get_quotes.php';

const ForexIndicator = new Lang.Class({
	Name: 'ForexIndicator',
	Extends: PanelMenu.Button,
 	buttonText: null,
	timeout: null,
	change_timeout_loop: false,
	pair: null,
	
	_init: function() {
		this.parent(0.0,"Forex Indicator",false);
		this.buttonText=new St.Label({
         	name: "forex-indicator-buttonText",
         	y_align: Clutter.ActorAlign.CENTER
     	});
		this.actor.add_actor(this.buttonText);
		this.actor.connect('button-press-event', Lang.bind(this, this.refresh));
      	this.actor.connect('key-press-event', Lang.bind(this, this.refresh));

		let item = new PopupMenu.PopupMenuItem("EURUSD");
        item.connect('activate', Lang.bind(this, function(){
			this.pair = "EURUSD";
			this.refresh();
		}));
		this.menu.addMenuItem(item);

		let item = new PopupMenu.PopupMenuItem("GBPUSD");
        item.connect('activate', Lang.bind(this, function(){
			this.pair = "GBPUSD";
			this.refresh();
		}));
		this.menu.addMenuItem(item);

		let item = new PopupMenu.PopupMenuItem("USDJPY");
        item.connect('activate', Lang.bind(this, function(){
			this.pair = "USDJPY";
			this.refresh();
		}));
		this.menu.addMenuItem(item);

		let item = new PopupMenu.PopupMenuItem("USDCHF");
        item.connect('activate', Lang.bind(this, function(){
			this.pair = "USDCHF";
			this.refresh();
		}));
		this.menu.addMenuItem(item);

		let item = new PopupMenu.PopupMenuItem("USDCAD");
        item.connect('activate', Lang.bind(this, function(){
			this.pair = "USDCAD";
			this.refresh();
		}));
		this.menu.addMenuItem(item);

		let item = new PopupMenu.PopupMenuItem("EURJPY");
        item.connect('activate', Lang.bind(this, function(){
			this.pair = "EURJPY";
			this.refresh();
		}));
		this.menu.addMenuItem(item);

		let item = new PopupMenu.PopupMenuItem("EURCHF");
        item.connect('activate', Lang.bind(this, function(){
			this.pair = "EURCHF";
			this.refresh();
		}));
		this.menu.addMenuItem(item);

		let item = new PopupMenu.PopupMenuItem("GBPJPY");
        item.connect('activate', Lang.bind(this, function(){
			this.pair = "GBPJPY";
			this.refresh();
		}));
		this.menu.addMenuItem(item);

		let item = new PopupMenu.PopupMenuItem("GBPCHF");
        item.connect('activate', Lang.bind(this, function(){
			this.pair = "GBPCHF";
			this.refresh();
		}));
		this.menu.addMenuItem(item);

		let item = new PopupMenu.PopupMenuItem("GOLD");
        item.connect('activate', Lang.bind(this, function(){
			this.pair = "GOLD";
			this.refresh();
		}));
		this.menu.addMenuItem(item);
		
		this.change_timeoutloop=true;
		this.refresh();
	},
	
	load_quote: function(pair, cb) {
		let params = {m: 'json', q: null};
		params.q=pair;
		const _httpSession = new Soup.Session();
  		let message = Soup.form_request_new_from_hash('GET', url, params);
		_httpSession.queue_message(message, Lang.bind(this, function(_httpSession, message) { 
         	let json = JSON.parse(message.response_body.data);
            for (let i in json) {
				cb(json[i].bid);
			}
					
		}));
	},

	refresh: function() {
		this.load_quote(this.pair, Lang.bind(this, function(txt) {
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

	remove_timeout: function() {
    	if(this.timeout) {
         	Mainloop.source_remove(this.timeout);
         	this.timeout=null;
      	}
   	},
	
	destroy: function(){
      this.remove_timeout();
	},

});

function init() {
}

function enable() {
   forex_indicator_object=new ForexIndicator;
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
