/*
 * Copyright 2014 IMOS
 *
 * The AODN/IMOS Portal is distributed under the terms of the GNU General Public License
 *
 */

Ext.namespace('Portal.cart');

Portal.cart.InsertionService = Ext.extend(Object, {

    constructor: function(downloadPanel) {

        this.downloadPanel = downloadPanel;
    },

    insertionValues: function(collection) {

        var config = {
            downloadConfirmation: this.downloadWithConfirmation,
            downloadConfirmationScope: this
        };

        var htmlInjection;

        if (this._isCollectionDownloadable(collection)) {
            if (collection.isNcwms()) {
                htmlInjection = new Portal.cart.NcWmsInjector(config);
            }
            else {
                htmlInjection = new Portal.cart.WmsInjector(config);
            }
        }
        else {
            htmlInjection = new Portal.cart.NoDataInjector(config);
        }

        return htmlInjection.getInjectionJson(collection);
    },

    _isCollectionDownloadable: function(collection) {
        return collection.getDataDownloadHandlers().length > 0;
    },

    downloadWithConfirmation: function(collection, generateUrlCallbackScope, generateUrlCallback, params) {
        this.downloadPanel.confirmDownload(collection, generateUrlCallbackScope, generateUrlCallback, params);
    }
});
