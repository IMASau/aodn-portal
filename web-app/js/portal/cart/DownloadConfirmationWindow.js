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

        this.downloadEmailPanel = new Portal.cart.DownloadEmailPanel();

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
                items: [this.downloadEmailPanel, contentPanel],
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


    showIfNeeded: function(params) {

        this.downloadEmailPanel.clearEmailValue();
        if (params.collectEmailAddress) {
            this.downloadEmailPanel.show();
        }
        else {
            this.downloadEmailPanel.hide();
        }

        this.params = params;
        this.onAcceptCallback = params.onAccept;

        if (!this.hasBeenShown || params.collectEmailAddress) {
            this.show();
        }
        else {
            this.onAccept();
        }
    },

    onAccept: function() {
        this.hide();

        if (this.onAcceptCallback) {
            this.params.emailAddress = this.downloadEmailPanel.getEmailValue();
            this.onAcceptCallback(this.params);
        }

        this.hasBeenShown = true;
    },

    onCancel: function() {
        this.hide();
    }
});
