/*
 * Copyright 2013 IMOS
 *
 * The AODN/IMOS Portal is distributed under the terms of the GNU General Public License
 *
 */
Ext.namespace('Portal.cart');

generateContentCount = 0;

Portal.cart.DownloadPanelBody = Ext.extend(Ext.Panel, {

    initComponent: function() {

        var config = {
            autoScroll: true,
            boxMinWidth: 800,
            width: 1024
        };

        this.store = Portal.data.ActiveGeoNetworkRecordStore.instance();
        this.confirmationWindow = new Portal.cart.DownloadConfirmationWindow();

        Ext.apply(this, config);
        Portal.cart.DownloadPanelBody.superclass.initComponent.call(this, arguments);

        Ext.MsgBus.subscribe(PORTAL_EVENTS.SELECTED_LAYER_CHANGED, function (eventName, openlayer) {
            this.generateContent();
        }, this);

    },

    generateContent: function() {
        var start = new Date().getTime();

        generateContentCount++;

        var tpl = new Portal.cart.DownloadPanelItemTemplate(this);
        var html = '';

        // Reverse the order of items, last item added will be displayed first
        for (var i = this.store.data.items.length - 1; i >= 0; i--) {
            var item = this.store.data.items[i];
            html += tpl.apply(item.data);
        }

        if (!html) {
            html = this._contentForEmptyView();
        }
        // fix for tests
        if (this.rendered) {
            this.update(html);
        }

        var end = new Date().getTime();
        var time = end - start;
//        console.log('generateContent (' + generateContentCount + ') took ' + time + 'ms');
    },

    confirmDownload: function(downloadUrl, downloadFilename, downloadControllerArgs) {
        this.confirmationWindow.showIfNeeded(downloadUrl, downloadFilename, downloadControllerArgs);
    },

    _contentForEmptyView: function() {
        return String.format('<i>{0}</i>', OpenLayers.i18n('noCollectionsMessage'));
    }
});
