/*
 * Copyright 2012 IMOS
 *
 * The AODN/IMOS Portal is distributed under the terms of the GNU General Public License
 *
 */

Ext.namespace('Portal.cart');

Portal.cart.DownloadConfirmationWindow = Ext.extend(Ext.Window, {

    initComponent: function() {

        // Content
        var contentPanel = new Ext.Panel({
            html: Portal.app.config.downloadCartConfirmationWindowContent,
            width: 450,
            resizable: false
        });

        // Controls
        var downloadButton = {
            text:OpenLayers.i18n('downloadConfirmationDownloadText'),
            listeners: {
                scope: this,
                click: this.onAccept
            }
        };
        var cancelButton = {
            text:OpenLayers.i18n('downloadConfirmationCancelText'),
            listeners: {
                scope: this,
                click: this.onCancel
            }
        };

        Ext.apply(this, {
            title:OpenLayers.i18n('downloadConfirmationWindowTitle'),
            modal: true,
            padding: 15,
            layout: 'fit',
            items: {
                autoHeight: true,
                autoWidth: true,
                padding: 5,
                xtype: 'form',
                items: [contentPanel],
                buttons: [downloadButton, cancelButton],
                keys: [
                    {
                        key: [Ext.EventObject.ESCAPE],
                        handler: this.onCancel,
                        scope: this
                    }
                ]
            },
            listeners: {
                show: this.onShow,
                scope: this
            }
        });

        Portal.cart.DownloadConfirmationWindow.superclass.initComponent.apply(this, arguments);
    },

    hide: function() {
        try {
            Portal.cart.DownloadConfirmationWindow.superclass.hide.call(this);
        }
        catch (e) {
            /**
             * Explicitly ignoring exception
             *
             * https://github.com/aodn/aodn-portal/issues/486
             *
             * Same bugfix as for #175:
             * https://github.com/aodn/aodn-portal/issues/175
             */
        }
    },

    showIfNeeded: function(downloadUrl, downloadFilename) {
        this.downloadUrl = downloadUrl;
        this.downloadFilename = downloadFilename;

        if (!this.hasBeenShown) {
            this.show();
        }
        else {
            this.onAccept();
        }
    },

    onAccept: function() {
        this.hide();

        var portalDownloadUrl = this._portalDownloadUrl();

        if (portalDownloadUrl) {

            this.hasBeenShown = true;
            this._openDownload(portalDownloadUrl);
        }
    },

    onCancel: function() {
        this.hide();
    },

    _portalDownloadUrl: function() {

        if (this.downloadUrl && this.downloadFilename) {

            var filename = encodeURIComponent(sanitiseForFilename(this.downloadFilename));

            return "/proxy" +
                "?url=" + encodeURIComponent(this.downloadUrl) +
                "&downloadFilename=" + filename;
        }

        return null;
    },

    _openDownload: function(url) {
        window.open(url, '_blank');
    }
});
