'use strict';

import security from './security';
import template from '../../template';
import db_alts from '../../../database/alts';
import db_accounts from '../../../database/accounts';
import Redis from '../../../redis';
import Config from '../../../config';

function handleIndex(req, res) {
    db_alts.fetch(100, 0, function (err, rows) {
        rows.forEach(function(row) {
            var channels = row.channels.split(",");
            row.channels_split = channels.map(Function.prototype.call, String.prototype.trim);
        });
        
        template.send(res, 'admin/alts/index', {
            pageTitle: "ALT Accounts",
            alts: rows
        });
    });
}

function handleEdit(req, res) {
    db_alts.fetchById(req.params.id, function (err, alt) {
        if (err) {
            return res.send(500);
        }
        if (!alt) {
            return res.send(404);
        }
        
        template.send(res, 'admin/alts/edit', {
            pageTitle: "Editing ALT Account",
            alt: alt,
            is_editing: true,
            action: "/admin/alts/edit/" + alt.id
        });
    });
}

function handleEditSave(req, res) {
    db_alts.fetchById(req.params.id, function (err, alt) {
        if (err) {
            return res.send(500);
        }
        if (!alt) {
            return res.send(404);
        }
        
        var fresh = {
            id: alt.id,
            name: req.body.name.trim(),
            password: req.body.password.trim(),
            channels: req.body.channels.trim(),
            responses: cleanResponses(req.body.responses.trim()),
            playlist: cleanPlaylist(req.body.playlist.trim()),
            queue_interval: req.body.queue_interval.trim(),
            is_enabled: req.body.is_enabled.trim()
        };
        
        if (fresh.name.length == 0 || fresh.channels.length == 0) {
            return template.send(res, 'admin/alts/edit', {
                pageTitle: "Editing ALT Account",
                alt: fresh,
                is_editing: true,
                action: "/admin/alts/edit/" + alt.id,
                errors: "The name and channels cannot be left blank."
            });
        }
        
        db_alts.fetchByName(fresh.name, function(err, row) {
            if (err) {
                return res.send(500);
            }
            if (row && row.id != alt.id) {
                return template.send(res, 'admin/alts/edit', {
                    pageTitle: "Editing ALT Account",
                    alt: fresh,
                    is_editing: true,
                    action: "/admin/alts/edit/" + alt.id,
                    errors: "The name already belongs to another alt account."
                });
            }
    
            db_alts.update(alt.id, fresh.name, fresh.password, fresh.channels, fresh.responses, fresh.playlist, fresh.queue_interval, fresh.is_enabled, function (err) {
                if (err) {
                    return res.send(500);
                }
        
                template.send(res, 'admin/alts/edit', {
                    pageTitle: "Editing ALT Account",
                    alt: fresh,
                    is_editing: true,
                    action: "/admin/alts/edit/" + alt.id
                });
            });
        });
    });
}

function handleCreate(req, res) {
    var alt = {
        name: "",
        password: "",
        channels: "",
        responses: "",
        playlist: "",
        queue_interval: 3600,
        is_enabled: 1
    };
    
    template.send(res, 'admin/alts/edit', {
        pageTitle: "Creating ALT Account",
        alt: alt,
        is_editing: false,
        action: "/admin/alts/create"
    });
}

function handleCreateSave(req, res) {
    var fresh = {
        name: req.body.name.trim(),
        password: req.body.password.trim(),
        channels: req.body.channels.trim(),
        responses: cleanResponses(req.body.responses.trim()),
        playlist: cleanPlaylist(req.body.playlist.trim()),
        queue_interval: req.body.queue_interval.trim(),
        is_enabled: req.body.is_enabled.trim()
    };
    
    if (fresh.name.length == 0 || fresh.channels.length == 0) {
        return template.send(res, 'admin/alts/edit', {
            pageTitle: "Creating ALT Account",
            alt: fresh,
            is_editing: false,
            action: "/admin/alts/create",
            errors: "The name and channels cannot be left blank."
        });
    }
    
    db_accounts.isUsernameTaken(fresh.name, function(err, is_taken) {
        if (err) return res.send(500);
        if (is_taken && fresh.password == "") {
            return template.send(res, 'admin/alts/edit', {
                pageTitle: "Creating ALT Account",
                alt: fresh,
                is_editing: false,
                action: "/admin/alts/create",
                errors: "The name already belongs to a registered account."
            });
        }
        
        db_alts.fetchByName(fresh.name, function(err, row) {
            if (err) return res.send(500);
            if (row) {
                return template.send(res, 'admin/alts/edit', {
                    pageTitle: "Creating ALT Account",
                    alt: fresh,
                    is_editing: false,
                    action: "/admin/alts/create",
                    errors: "The name is already being used by another alt account."
                });
            }
    
            db_alts.insert(fresh.name, fresh.password, fresh.channels, fresh.responses, fresh.playlist, fresh.queue_interval, fresh.is_enabled, function (err) {
                if (err) {
                    return res.send(500);
                }
        
                res.redirect('/admin/alts');
            });
        });
    });
}

function handleSpeak(req, res) {
    var alt_id  = req.body.alt_id;
    var text    = req.body.text;
    var channel = req.body.channel;
    
    Redis.createClient(Config.get("redis.databases").alts, function(err, client) {
        if (err) {
            client.quit();
            return res.json({
                message: "Redis connection failed."
            }, 500);
        }
    
        var key = "alts:speak:" + alt_id;
        var value = JSON.stringify({text: text, channel: channel});
        client.hset(key, value, Date.now(), function(err) {
            if (err) {
                client.quit();
                return res.json({
                    message: "Redis hset failed."
                }, 500);
            }
    
            client.quit();
            res.json({status: "ok"});
        });
    });
}

function cleanResponses(responses) {
    var cleaned = [];
    var lines = responses.split(/\r?\n/);
    lines.forEach(function(line) {
        line = line.trim();
        cleaned.push(line);
    });
    
    return cleaned.join("\n");
}

function cleanPlaylist(playlist) {
    var cleaned = [];
    var urls = playlist.split(/\r?\n/);
    urls.forEach(function(url) {
        url = url.trim();
        cleaned.push(url);
    });
    
    return cleaned.join("\n");
}

module.exports = {
    /**
     * Initializes auth callbacks
     */
    init: function (app) {
        app.get('/admin/alts', security, handleIndex);
        app.get('/admin/alts/edit/:id', security, handleEdit);
        app.post('/admin/alts/edit/:id', security, handleEditSave);
        app.get('/admin/alts/create', security, handleCreate);
        app.post('/admin/alts/create', security, handleCreateSave);
        app.post('/admin/alts/speak', security, handleSpeak);
    }
};