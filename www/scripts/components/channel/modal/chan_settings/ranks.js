'use strict';

var React  = require('react');
var Reflux = require('reflux');

var Component = React.createClass({
    render: function () {
        return (
            <div role="tabpanel" className="tab-pane" id="modal-settings-pane-ranks">
                Ranks
            </div>
        )
    }
});

module.exports = Component;
