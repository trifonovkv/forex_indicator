const St = imports.gi.St;
const Main = imports.ui.main;
const Soup = imports.gi.Soup;
const Lang = imports.lang;
const Mainloop=imports.mainloop;
const GLib = imports.gi.GLib; 

let button;
let url = 'http://quotes.instaforex.com/get_quotes.php';
let params = {
			m: 'json',
			q: 'gold'
			};

const Quotes = new Lang.Class({
});

const QuotesMenuButton = new Lang.Class({
	Name: 'QuotesMenuButton',
	timeout: null,
	change_timeout_loop: false,
	
	_init: function() {
		this.change_timeoutloop=true;
		this.refresh();
	},

	load_json_sync: function(url, params) {
    	const _httpSession = new Soup.SessionSync();
  		let message = Soup.form_request_new_from_hash('GET',url,params);	
		_httpSession.send_message(message);
		this.response = JSON.parse(message.response_body.data);
	},

	get_bid: function() {
		this.load_json_sync(url, params);
		this.bid = this.response.GOLD.bid;
		button.set_text(this.bid);
	},

	refresh: function() {
    	this.get_bid();
    	if(this.change_timeoutloop) {
			this.remove_timeout();
			this.timeout = Mainloop.timeout_add_seconds(10, Lang.bind(this, this.refresh));
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
    button = new St.Label();
}

function enable() {
	Quotes = new QuotesMenuButton;
    Main.panel._rightBox.insert_child_at_index(button, 0);
}

function disable() {
    Main.panel._rightBox.remove_child(button);
}
