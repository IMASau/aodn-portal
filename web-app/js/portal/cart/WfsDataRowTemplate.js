/*
 * Copyright 2013 IMOS
 *
 * The AODN/IMOS Portal is distributed under the terms of the GNU General Public License
 *
 */
Ext.namespace('Portal.cart');

Portal.cart.WfsDataRowTemplate = Ext.extend(Ext.XTemplate, {

    constructor: function(downloadPanelTemplate) {
        this.downloadPanelTemplate = downloadPanelTemplate;

        var templateLines = [
            '<div class="row data">',
            '  <div class="subheading">' + OpenLayers.i18n('dataSubheading') + '</div>',
            '  {[this._getDataFilterEntry(values)]}',
            '  {[this._getDataDownloadEntry(values)]}',
            '</div>'
        ];

        Portal.cart.WfsDataRowTemplate.superclass.constructor.call(this, templateLines);
    },

    applyWithControls: function(values) {
        return this._replacePlaceholdersWithControls(this.apply(values), values);
    },

    _getDataFilterEntry: function(values) {
        var wmsLayer = values.wmsLayer;

        if (wmsLayer) {

            var cqlText = wmsLayer.getDownloadFilter();
            var html;

            if (cqlText) {
                html = String.format('<b>{0}</b> <code>{1}</code>', OpenLayers.i18n('filterLabel'), cqlText);
            }
            else {
                html = OpenLayers.i18n('noFilterMessage');
            }

            return this.downloadPanelTemplate._makeEntryMarkup(html);
        }

        return "";
    },

    _getDataDownloadEntry: function(values) {

        var html = String.format('<div id="wfs-download-button-{0}"></div>', values.uuid); // Download button placeholder

        return this.downloadPanelTemplate._makeEntryMarkup(html);
    },

    _replacePlaceholdersWithControls: function(html, collection) {
        var elementId = 'wfs-download-button-' + collection.uuid;

        this._createDownloadButton.defer(1, this, [html, elementId, collection]);

        return html;
    },

    _createDownloadButton: function(html, id, collection) {
        var downloadMenu = new Ext.menu.Menu({
            items: this._createMenuItems(collection)
        });

        new Ext.Button({
            text: OpenLayers.i18n('downloadButtonLabel'),
            icon: 'images/down.png',
            scope: this,
            menu: downloadMenu
        }).render(html, id);
    },

    _createMenuItems: function(collection) {

        var menuItems = [];

        menuItems.push({text: OpenLayers.i18n('downloadAsCsvLabel'), handler: this._downloadHandlerFor(collection, 'csv'), scope: this});
        menuItems.push({text: OpenLayers.i18n('downloadAsGml3Label'), handler: this._downloadHandlerFor(collection, 'gml3'), scope: this});
        menuItems.push({text: OpenLayers.i18n('downloadAsShapefileLabel'), handler: this._downloadHandlerFor(collection, 'shape-zip', 'zip'), scope: this});

        if (collection.wmsLayer && collection.wmsLayer.urlDownloadFieldName) {
            menuItems.push({text: OpenLayers.i18n('downloadAsUrlsLabel'), handler: this._urlListDownloadHandler(collection), scope: this});
        }

        return menuItems;
    },

    _downloadHandlerFor: function(collection, format, fileExtension) {

        var downloadUrl = this._wfsUrlForGeoNetworkRecordWfsLayer(collection, format);

        var extensionToUse = fileExtension ? fileExtension : format;
        var downloadFilename = collection.title + "." + extensionToUse;

        return function() {

            this.downloadPanelTemplate.downloadWithConfirmation(downloadUrl, downloadFilename);
        };
    },

    _urlListDownloadHandler: function(collection) {

        var downloadUrl = this._wfsUrlForGeoNetworkRecordWmsLayer(collection, 'csv');
        var downloadFilename = collection.title + "_URLs.txt";
        var additionalArgs = {
            action: 'urlListForLayer',
            layerId: collection.wmsLayer.grailsLayerId
        };

        return function() {

            this.downloadPanelTemplate.downloadWithConfirmation(downloadUrl, downloadFilename, additionalArgs);
        };
    },

    _wfsUrlForGeoNetworkRecordWmsLayer: function(record, format) {
        return record.wmsLayer.getWmsLayerFeatureRequestUrl(format);
    },

    _wfsUrlForGeoNetworkRecordWfsLayer: function(record, format) {
        return record.wmsLayer.getWfsLayerFeatureRequestUrl(format);
    }
});
