/*
 * Copyright 2012 IMOS
 *
 * The AODN/IMOS Portal is distributed under the terms of the GNU General Public License
 *
 */

Ext.namespace('Portal.ui');

Portal.ui.MapOptionsPanel = Ext.extend(Ext.Panel, {

    constructor: function (cfg) {

        this.baseLayerCombo = new GeoExt.ux.BaseLayerComboBox({
            map: cfg.map,
            editable: false,
            width: 175,
            padding: 20,
            emptyText: 'Choose a Base Layer'
        });

        this.label = new Ext.form.Label({
            html: "<h4>" + OpenLayers.i18n('mapGlobalOptionsTitle') + "</h4>"
        });

        this.autoZoomCheckbox = new Ext.form.Checkbox({
            boxLabel: OpenLayers.i18n('autozoom'),
            inputType: 'checkbox',
            checked: Portal.app.appConfig.portal.autoZoom
        });
        this.autoZoomCheckbox.addEvents('autozoomchecked', 'autozoomunchecked');
        this.autoZoomCheckbox.on('check', function (box, checked) {
            var event = checked ? 'autozoomchecked' : 'autozoomunchecked';
            box.fireEvent(event, box, checked);
            Portal.app.appConfig.portal.autoZoom = checked;
        }, this);


        var config = Ext.apply({
            title: OpenLayers.i18n('mapTabTitle'),
            items: [
                this.label,
                this.autoZoomCheckbox,
                new Ext.Spacer({height: 5}),
                this.baseLayerCombo
            ]
        }, cfg);

        Portal.ui.MapOptionsPanel.superclass.constructor.call(this, config);

        Ext.MsgBus.subscribe(PORTAL_EVENTS.SELECTED_LAYER_CHANGED, function(subject, openLayer) {
            this.setAutoZoomCheckbox();
        }, this);

        this.relayEvents(this.autoZoomCheckbox, ['autozoomchecked', 'autozoomunchecked']);
    },

    autoZoomEnabled: function () {
        return Portal.app.config.autoZoom;
    },

    setAutoZoomCheckbox: function() {
        if (Portal.app.appConfig.portal.autoZoom != this.autoZoomCheckbox.getValue() && this.rendered) {
            this.autoZoomCheckbox.setValue(Portal.app.appConfig.portal.autoZoom);
        }
    }


});
