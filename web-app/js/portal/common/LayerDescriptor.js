/*
 * Copyright 2012 IMOS
 *
 * The AODN/IMOS Portal is distributed under the terms of the GNU General Public License
 *
 */

Ext.namespace('Portal.common');

/**
 * Layer descriptor constructs OpenLayers WMS object with parameters from
 * server and geonetwork record
 */
Portal.common.LayerDescriptor = Ext.extend(Object, {

    WFS_PROTOCOL: 'OGC:WFS-1.0.0-http-get-capabilities',
    WMS_PROTOCOL: 'OGC:WMS-1.1.1-http-get-map',

    constructor: function(cfg, titleOverride, dataCollection, openLayerClass) {

        this.openLayerClass = openLayerClass || OpenLayers.Layer.WMS;
        this.dataCollection = dataCollection;

        Ext.apply(this, cfg);

        if (titleOverride) {
            this.title = titleOverride;
        }
    },

    toOpenLayer: function(optionOverrides, paramOverrides) {
        var openLayer = new this.openLayerClass(
            this.title,
            this.server.uri,
            new Portal.ui.openlayers.LayerParams(this, paramOverrides),
            new Portal.ui.openlayers.LayerOptions(this, optionOverrides)
        );
        this._setDomainLayerProperties(openLayer);

        return openLayer;
    },

    _getLayerWorkspace: function(layerName) {
        var workspace = null;
        if (layerName.indexOf(":") != -1) {
            workspace = layerName.split(":")[0];
        }
        return workspace;
    },

    /**
     * Refactor.
     */
    _setDomainLayerProperties: function(openLayer) {
        openLayer.server = this.server;
        openLayer.wmsName = this.name;

        this._setOpenLayerBounds(openLayer);
        this._initialiseDownloadLayer(openLayer);
        openLayer.projection = this.projection;
        openLayer.blacklist = this.blacklist;
        openLayer.abstractTrimmed = this.abstractTrimmed;
        openLayer.dimensions = this.dimensions;
        openLayer.params.QUERYABLE = true;

        if (this.viewParams) {
            openLayer.zoomOverride = {
                centreLon: this.viewParams.centreLon,
                centreLat: this.viewParams.centreLat,
                openLayersZoomLevel: this.viewParams.openLayersZoomLevel
            }
        }
    },

    _initialiseDownloadLayer: function(openLayer) {

        if (this.dataCollection) {
            var links = this.dataCollection.getMetadataRecord().data.links;

            var downloadLayerName = this._findFirst(links, this.WFS_PROTOCOL);

            if (!downloadLayerName) {
                downloadLayerName = this._findFirst(links, this.WMS_PROTOCOL);
            }

            if (downloadLayerName) {
                // If layer has no workspace defined, assume it is in the same workspace as the WMS layer
                if (!this._getLayerWorkspace(downloadLayerName) && this._getLayerWorkspace(openLayer.wmsName)) {

                    downloadLayerName = this._getLayerWorkspace(openLayer.wmsName) + ":" + downloadLayerName;
                }

                openLayer.getDownloadLayer = function() { return downloadLayerName };
            }
        }
    },

    _findFirst: function(links, protocol) {

        var layerName = null;

        Ext.each(links, function(link) {

            if (link.protocol == protocol) {

                layerName = link.name;

                return false;
            }
        });

        return layerName;
    },

    _setOpenLayerBounds: function(openLayer) {

        if (this.dataCollection) {
            var metadataRecord = this.dataCollection.getMetadataRecord();
            var bounds = metadataRecord.data.bbox.getBounds();

            openLayer.bboxMinX = bounds.left;
            openLayer.bboxMinY = bounds.bottom;
            openLayer.bboxMaxX = bounds.right;
            openLayer.bboxMaxY = bounds.top;
        }
    }
});
