'use strict';

var React  = require('react');
var Reflux = require('reflux');

var Component = React.createClass({
    render: function () {
        return (
            <div role="tabpanel" className="tab-pane" id="modal-options-pane-mod">
                Mod
            </div>
        )
    }
});

module.exports = Component;
