/*
 * Copyright 2013 IMOS
 *
 * The AODN/IMOS Portal is distributed under the terms of the GNU General Public License
 *
 */
Ext.namespace('Portal.cart');

Portal.cart.Downloader = Ext.extend(Ext.util.Observable, {

    constructor: function(cfg) {
        this.currentlyDownloading = false;
        Ext.apply(this, cfg);

        Portal.cart.Downloader.superclass.constructor.call(this, cfg);

        this.addEvents('downloadsuccess', 'downloadfailure');
    },

    start: function() {
        this.currentlyDownloading = true;

        Ext.Ajax.request({
            url: 'downloadCart/download',
            success: this._onDownloadSuccess,
            failure: this._onDownloadFailure,
            params: {
                items: this.store.getItemsEncodedAsJson()
            },
            scope: this
        });
    },

    isDownloading: function() {
        return this.currentlyDownloading;
    },

    _onDownloadSuccess: function() {
        this.currentlyDownloading = false;
        this.fireEvent('downloadsuccess');
    },

    _onDownloadFailure: function() {
        this.currentlyDownloading = false;
        this.fireEvent('downloadfailure');
    }
});

Portal.cart.Downloader.isDownloadableLink = function(link) {
    return (   Portal.cart.Downloader.isDownloadableProtocol(link.protocol)
            && Portal.app.config.downloadCartMimeTypeToExtensionMapping[link.type]);
}

Portal.cart.Downloader.isDownloadableProtocol = function(protocol) {
    var protocols = [];

	Ext.each(Portal.app.config.downloadCartDownloadableProtocols.split("\n"), function(protocol) {
		protocols.push(protocol.trim())
	});

	return (protocols.indexOf(protocol) != -1);
}
