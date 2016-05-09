'use strict';

var Reflux        = require('reflux');
var SocketActions = require('../actions/socket');
var Events        = require('../events');

module.exports = Reflux.createStore({
    listenables: [SocketActions],
    socket: null,
    data: {
        rank: -1,
        super_admin: false,
        leader: false,
        name: "",
        logged_in: false,
        guest: true,
        profile: {
            image: "",
            text: ""
        }
    },
    
    getInitialState() {
        return this.data;
    },
    
    onConnectDone: function() {
        if (this.data.name && this.data.guest) {
            SocketActions.emit(Events.LOGIN, {
                name: this.data.name
            });
        }
    },
    
    onLoginDone: function(data) {
        this.data.name      = data.name;
        this.data.guest     = data.guest;
        this.data.logged_in = true;
        this.trigger(this.data);
    },
    
    onLoginFail: function(data) {
        console.log(data);
    },
    
    onRank: function(rank) {
        this.data.rank = rank;
        if (rank >= 255) {
            this.data.super_admin = true;
        }
        this.trigger(this.data);
    }
});