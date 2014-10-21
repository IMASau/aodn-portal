/*
 * Copyright 2013 IMOS
 *
 * The AODN/IMOS Portal is distributed under the terms of the GNU General Public License
 *
 */
OpenLayers.Layer.NcWMS = OpenLayers.Class(OpenLayers.Layer.WMS, {

    DEFAULT_GIF_HEIGHT: 512,
    FRAMES_TO_LOAD_ON_INIT: 1,

    /**
     * Moment in time that this layer represents.
     */
    time: null,

    /**
     * Valid temporal extent of the layer as Array of times.
     */
    temporalExtent: null,

    /**
     * Missing days in temporal extent
     */
    missingDays: null,

    initialize: function(name, url, params, options, temporalInfo) {

        this.EVENT_TYPES.push('temporalextentloaded');

        this._initToMostRecentTime(temporalInfo.defaultValue);
        params['TIME'] = this._getTimeParameter(this.time);

        this.temporalExtent = new Portal.visualise.animations.TemporalExtent();

        // Initialize missingDays
        this.missingDays = [];

        Ext.MsgBus.subscribe(PORTAL_EVENTS.LAYER_REMOVED, this._propagateDelete, this);

        OpenLayers.Layer.WMS.prototype.initialize.apply(this, [name, url, params, options]);

        // We assume that before the first GFI request we will be quick enough
        // to complete that little tiny request
        this._setMetadataFromNcWMS();
    },

    _setMetadataFromNcWMS: function() {
        Ext.ux.Ajax.proxyRequest({
            scope: this,
            url: this._getMetadataFromNcWMS(),
            success: function(resp, options) {
                try {
                    this._metadataLoaded(resp.responseText);
                }
                catch (e) {
                    log.error("Could not parse metadata for NcWMS layer '" + this.params.LAYERS + "'");
                }
            },
            failure: function() {
                log.error("Could not get metadata for NcWMS layer '" + this.params.LAYERS + "'");
            }
        });
    },

    _metadataLoaded: function(response) {
        this.metadata = Ext.util.JSON.decode(response);
        var datesWithData = this._parseDatesWithData(this.metadata);

        this.temporalExtent.addDays(datesWithData);
        this.events.triggerEvent('temporalextentloaded', this);
    },

    _initToMostRecentTime: function(dateTimeString) {
        this.time = moment.utc(dateTimeString);
    },

    _propagateDelete: function(label, thelayer) {
        if (thelayer == this) {
            delete this;
        }
    },

    processTemporalExtent: function() {

        if (this._destroyed()) {
            return;
        }

        // TODO
        //this.temporalExtent.parse(this.rawTemporalExtent);
        this._initSubsetExtent();
        this.events.triggerEvent('temporalextentloaded', this);
    },

    getTimeOfDay: function() {
        /// TODO
    },

    _destroyed: function() {
        return !this.events;
    },

    /**
     * Temporal extent functions
     */

    getTemporalExtent: function() {
        return this.temporalExtent;
    },

    getTemporalExtentMin: function() {
        return this.temporalExtent.min();
    },

    getTemporalExtentMax: function() {
        return this.temporalExtent.max();
    },

    toTime: function(dateTime) {
        // Don't send a request if we don't have to
        if (this._isValidTime(dateTime)) {
            this.time = dateTime;
            this.mergeNewParams({ TIME: this._getTimeParameter(this.time) });
        }
        return this.time;
    },

    getMissingDays: function() {
        return this.temporalExtent.getMissingDays();
    },

    /**
     * URL handling functions
     */

    /**
     * Method: getURL
     * Return a GetMap query string for this layer
     *
     * Parameters:
     * bounds - {<OpenLayers.Bounds>} A bounds representing the bbox for the
     *                                request.
     *
     * Returns:
     * {String} A string with the layer's url and parameters and also the
     *          passed-in bounds and appropriate tile size specified as
     *          parameters.
     */
    getURL: function(bounds) {
        return OpenLayers.Layer.WMS.prototype.getURL.apply(this, [bounds]);
    },

    _parseDatesWithData: function(ncwmsMetadata) {
        datesWithDataArray = [];

        if (ncwmsMetadata['datesWithData']) {
            Ext.each(Object.keys(ncwmsMetadata['datesWithData']), function(year) {
                Ext.each(Object.keys(ncwmsMetadata['datesWithData'][year]), function(month) {
                    Ext.each(ncwmsMetadata['datesWithData'][year][month], function(day) {
                        dateWithData = new moment.utc(year + "-" + month + "-" + day, "YYYY-MM-DD");
                        datesWithDataArray.push(dateWithData);
                    });
                });
            });
        }

        return datesWithDataArray;
    },

    _getTimeParameter: function(dateTime) {
        return dateTime.clone().utc().format('YYYY-MM-DDTHH:mm:ss.SSS');
    },

    _getMetadataFromNcWMS: function() {
        var metadataUrl = this.url + "?layerName=" + this.params.LAYERS + "&REQUEST=GetMetadata&item=layerDetails";
        return metadataUrl;
    },

    /* Overrides */
    getFeatureInfoRequestString: function(clickPoint, overrideParams) {
        overrideParams.TIME = this._getTimeParameter(this.time);
        overrideParams.INFO_FORMAT = this.getFeatureInfoFormat();
        return OpenLayers.Layer.WMS.prototype.getFeatureInfoRequestString.call(this, clickPoint, overrideParams);
    },

    /* Overrides */
    getFeatureInfoFormat: function() {
        return "text/xml";
    },

    /* Overrides */
    formatFeatureInfoHtml: function(resp, options) {
        return formatGetFeatureInfo(resp, options);
    },

    isNcwms: function() {
        return true;
    },

    previousTimeSlice: function() {
        return this.toTime(this.temporalExtent.previous(this.time));
    },

    nextTimeSlice: function() {
        return this.toTime(this.temporalExtent.next(this.time));
    },

    getCqlForTemporalExtent: function() {
        if (!this.bodaacFilterParams) {
            return null;
        }

        var cqlParts = [];

        var start = this.bodaacFilterParams.dateRangeStart;
        if (start) {
            cqlParts.push('time >= ' + start.toISOString());
        }

        var end = this.bodaacFilterParams.dateRangeEnd;
        if (end) {
            cqlParts.push('time <= ' + end.toISOString());
        }

        return cqlParts.join(" and ");
    },

    _buildGetFeatureRequestUrl: function(baseUrl, layerName, outputFormat) {
        // Call the WMS class and apply NO download filters (null)
        var wfsRequest = OpenLayers.Layer.WMS.prototype._buildGetFeatureRequestUrl.apply(
            this,
            [
                baseUrl,
                layerName,
                outputFormat,
                null
            ]
        );

        var cql = this.getCqlForTemporalExtent();
        if (cql) {
            wfsRequest += "&CQL_FILTER=" + encodeURIComponent(cql);
        }

        return wfsRequest;
    },

    _initSubsetExtent: function() {
        if (!this.subsetExtent) {
            this.setSubsetExtentView(this.temporalExtent.min(), this.temporalExtent.max());
        }
    },

    setSubsetExtentView: function(min, max) {
        this.subsetExtent = {
            min: min,
            max: max
        };
    },

    getSubsetExtentMin: function() {
        return (this.subsetExtent) ? this.subsetExtent.min : null;
    },

    getSubsetExtentMax: function() {
        return (this.subsetExtent) ? this.subsetExtent.max : null;
    },

    _isValidTime: function(dateTime) {
        return dateTime && this.getTemporalExtent().isValid(dateTime) && this.time.valueOf() != dateTime.valueOf();
    }
});
