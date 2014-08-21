const St = imports.gi.St;
const Main = imports.ui.main;
const Soup = imports.gi.Soup;
const Lang = imports.lang;
const Mainloop=imports.mainloop;
const Clutter=imports.gi.Clutter;
const PanelMenu=imports.ui.panelMenu;
const PopupMenu=imports.ui.popupMenu;
const Util = imports.misc.util;

const Gettext = imports.gettext.domain('gnome-shell-extension-forexindicator');
const _ = Gettext.gettext;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Config = imports.misc.config;
const Convenience = Me.imports.convenience;

const FOREX_SETTINGS_SCHEMA = 'org.gnome.shell.extensions.forexindicator';
const FOREX_PAIR_CURRENT = 'pair-current';
const FOREX_REFRESH_INTERVAL = 'refresh-interval';
const FOREX_PRICE_IN_PANEL = 'price-in-panel';
const FOREX_ONLINE_STATUS = 'online-status';

const QUOTES_URL = 'http://quotes.instaforex.com/get_quotes.php';
const UP_POINTING = String.fromCharCode(9650);
const DOWN_POINTING = String.fromCharCode(9660);

let _httpSession;

const ForexIndicator = new Lang.Class({
    Name: 'ForexIndicator',
    Extends: PanelMenu.Button,
	
    _init: function() {
        this.parent(0.0, "Forex Indicator", false);
		this._loadConfig();
        this._online_status = this._onlineStatusConf;
        this.buttonText=new St.Label({ text: _("Loading..."),
                                       y_align: Clutter.ActorAlign.CENTER});	
        this.actor.add_actor(this.buttonText);

        let label = new St.Label({ text: _("Symbol")});
        this.symbol = new St.Label();
        let item = new PopupMenu.PopupBaseMenuItem({ reactive: false});
        item.actor.add(this.symbol, { expand: true });
        item.actor.add(label);		
        this.menu.addMenuItem(item);

        let label = new St.Label({ text: _("Ask")});
        this.ask = new St.Label();
        let item = new PopupMenu.PopupBaseMenuItem({ reactive: false});
        item.actor.add(this.ask, { expand: true });
        item.actor.add(label);
        this.menu.addMenuItem(item);

        let label = new St.Label({ text: _("Bid")});
        this.bid = new St.Label();
        let item = new PopupMenu.PopupBaseMenuItem({ reactive: false});
        item.actor.add(this.bid, { expand: true });
        item.actor.add(label);
        this.menu.addMenuItem(item);

        let label = new St.Label({ text: _("Change")});
        this.change = new St.Label();
        let item = new PopupMenu.PopupBaseMenuItem({ reactive: false});
        item.actor.add(this.change, { expand: true });
        item.actor.add(label);
        this.menu.addMenuItem(item);

        this.lasttime = new St.Label();
        let item = new PopupMenu.PopupBaseMenuItem({ reactive: false});
        item.actor.add(this.lasttime);
        this.menu.addMenuItem(item);

        let item = new PopupMenu.PopupSeparatorMenuItem();
        this.menu.addMenuItem(item);

        let item = new PopupMenu.PopupMenuItem(_("Reload"));
        item.connect('activate', Lang.bind(this, function() {
            this._online_status = true;
            this._refresh();
        }));
        this.menu.addMenuItem(item);
		
        let item = new PopupMenu.PopupMenuItem(_("Settings"));
        item.connect('activate', Lang.bind(this, this._onPreferencesActivate));
        this.menu.addMenuItem(item);

        let item = new PopupMenu.PopupMenuItem(_("Offline / Online"));
        item.connect('activate', Lang.bind(this, this._setOffline));
        this.menu.addMenuItem(item);
		
        this._refresh();
    },

    _loadData: function() {
        let params = {m: 'json', q: this._currentPair};
        _httpSession = new Soup.Session();
        let message = Soup.form_request_new_from_hash('GET', QUOTES_URL, params);
        _httpSession.queue_message(message, Lang.bind(this, function(_httpSession, message) { 
            if (message.status_code !== 200)
			    return;
            let json = JSON.parse(message.response_body.data);
            this._buildUI(json);					
        }));
    },

    _refresh: function() {
        if(this._online_status == false) {;
            this.buttonText.set_text(_("Offline"));
            return;
        }
        this._loadData();
        this._removeTimeout();
        this._timeout = Mainloop.timeout_add_seconds(this._refreshInterval, 
                                                Lang.bind(this, this._refresh));
        return true;
    },

    _setOffline: function() {
        if(this._online_status == true) {
            this._removeTimeout();
            this.buttonText.set_text(_("Offline"));
            this._online_status = false;
        }
        else {
			this._online_status = true;
            this._refresh();
        }		
    },
	
    _onPreferencesActivate: function() {
        Util.spawn(["gnome-shell-extension-prefs", "forex_indicator@trifonovkv.gmail.com"]);
        return 0;
    },	

    _loadConfig: function() {
        this._settings = Convenience.getSettings(FOREX_SETTINGS_SCHEMA);
        this._settingsC = this._settings.connect("changed", Lang.bind(this, function() {
            this._refresh();
        }));
    },

    _buildUI: function(data) {
        for (let i in data) {
            this.symbol.set_text(data[i].symbol);
            this.ask.set_text(data[i].ask);
            this.bid.set_text(data[i].bid);
            this.change.set_text(data[i].change);
            let date = new Date((data[i].lasttime-10800)*1000);
            this.lasttime.set_text(date.toLocaleString());
        }

        let txt;
        if(this.change > 0)
            txt = UP_POINTING;
        else
            txt = DOWN_POINTING;

        if(this._priceInPanel == "Ask")
            txt = txt + ' ' + this.ask.text;
        else
            txt = txt + ' ' + this.bid.text;
			
        this.buttonText.set_text(txt);
    },

    get _currentPair() {
        if (!this._settings)
            this._loadConfig();
        return this._settings.get_string(FOREX_PAIR_CURRENT);
    },		

    get _refreshInterval() {
        if (!this._settings)
            this._loadConfig();
        return this._settings.get_int(FOREX_REFRESH_INTERVAL);
    },

    get _priceInPanel() {
        if (!this._settings)
            this._loadConfig();
        return this._settings.get_string(FOREX_PRICE_IN_PANEL);
    },
	
	get _onlineStatusConf() {
        if (!this._settings)
            this._loadConfig();
        return this._settings.get_boolean(FOREX_ONLINE_STATUS);
    },

	set _onlineStatusConf(v) {
        if (!this._settings)
            this._loadConfig();
        this._settings.set_boolean(FOREX_ONLINE_STATUS, v);
    },

    _removeTimeout: function() {
        if(this._timeout) {
            Mainloop.source_remove(this._timeout);
            this._timeout=null;
        }
    },

	stop: function() {
        if (_httpSession !== undefined)
            _httpSession.abort();
        _httpSession = undefined;

        if (this._timeout)
            Mainloop.source_remove(this._timeout);
        this._timeout = undefined;

		this._onlineStatusConf = this._online_status;

        if (this._settingsC) {
            this._settings.disconnect(this._settingsC);
            this._settingsC = undefined;
        }
    }
});

let forexMenu;

function init() {
    Convenience.initTranslations('gnome-shell-extension-forexindicator');
}

function enable() {	
    forexMenu = new ForexIndicator;
    Main.panel.addToStatusArea('forex-indicator', forexMenu);
}

function disable() {
    forexMenu.stop();
    forexMenu.destroy();
}
