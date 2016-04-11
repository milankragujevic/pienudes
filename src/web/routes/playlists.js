"use strict";
import template from '../template';
import Config from '../../config';
import playlists from '../../database/playlist';

function handleHistory(req, res) {
    var page = req.params.page;
    if (page == undefined) {
        page = 1;
    }
    if (page < 1) {
        page = 1;
    }
    
    playlists.countPlaylistHistory(function(err, count) {
        var limit  = 100;
        var pages  = Math.ceil(count / limit);
        if (page > pages) {
            page = pages;
        }
        var offset = (page - 1) * limit;
        
        playlists.fetchPlaylistHistory(limit, offset, function(err, rows) {
            template.send(res, 'playlists/history', {
                media: rows,
                page:  page,
                pages: pages
            });
        });
    });
}

module.exports = {
    /**
     * Initializes auth callbacks
     */
    init: function (app) {
        app.get('/playlists/history/:page?', handleHistory);
    }
};