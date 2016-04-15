var nunjucks  = require('nunjucks');
var fs        = require("fs");
var path      = require("path");
var Config    = require("../config");
var templates = path.join(__dirname, "..", "..", "templates");

nunjucks.configure(templates, { autoescape: true });

/**
 * Merges locals with globals for template rendering
 */
function merge(locals, res) {
    var _locals = {
        siteTitle:       Config.get("html-template.title"),
        siteDescription: Config.get("html-template.description"),
        siteAuthor:      "",
        csrfToken:       typeof res.req.csrfToken === 'function' ? res.req.csrfToken() : '',
        baseUrl:         getBaseUrl(res),
        loginDomain:     Config.get("https.enabled") ? Config.get("https.full-address")
                                                     : Config.get("http.full-address")
    };
    if (typeof locals !== "object") {
        return _locals;
    }
    for (var key in locals) {
        _locals[key] = locals[key];
    }
    
    return _locals;
}

/**
 * Returns the site base url
 */
function getBaseUrl(res) {
    var req = res.req;
    return req.realProtocol + "://" + req.header("host");
}

/**
 * Renders and serves a template
 */
function send(res, view, locals) {
    locals.loggedIn  = locals.loggedIn || !!res.user;
    locals.loginName = locals.loginName || res.user ? res.user.name : false;
    var file = view + ".html.twig";
    var html = nunjucks.render(file, merge(locals, res));
    res.send(html);
}

module.exports = {
    send: send
};