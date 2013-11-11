/*
 * Copyright 2012 IMOS
 *
 * The AODN/IMOS Portal is distributed under the terms of the GNU General Public License
 *
 */

OpenLayers.Layer.WMS.prototype.adjustBounds = function (bounds) {
    if (this.wrapDateLine) {
        // wrap around the date line, within the limits of rounding error
        var wrappingOptions = {
            'rightTolerance':this.map.getResolution(),
            'leftTolerance':this.map.getResolution()
        };
        bounds = bounds.wrapDateLine(this.maxExtent, wrappingOptions);
    }

    if (this.gutter) {
        // Adjust the extent of a bounds in map units by the
        // layer's gutter in pixels.

        var mapGutter = this.gutter * this.map.getResolution();
        bounds = new OpenLayers.Bounds(
            bounds.left - mapGutter,
            bounds.bottom - mapGutter,
            bounds.right + mapGutter,
            bounds.top + mapGutter);
    }

    return bounds;
};

// Modifications to OpenLayers class prototypes
OpenLayers.Layer.WMS.prototype.isNcwms = function () {
    if (this.server) {
        return ["NCWMS-1.1.1", "NCWMS-1.3.0", "THREDDS"].indexOf(this.server.type) >= 0;
    }

    return false;
};

OpenLayers.Layer.WMS.prototype.getFeatureInfoRequestString = function (clickPoint, overrideParams) {
    var baseFeatureInfoParams = {
        REQUEST:"GetFeatureInfo",
        EXCEPTIONS:"application/vnd.ogc.se_xml",
        BBOX:this._getBoundingBox(),
        INFO_FORMAT:this.getFeatureInfoFormat(),
        QUERY_LAYERS:this.params.LAYERS,
        FEATURE_COUNT:this.isNcwms() ? 1 : 100,
        SRS:'EPSG:4326',
        CRS:'EPSG:4326',
        WIDTH:this.map.size.w,
        HEIGHT:this.map.size.h
    };

    if (clickPoint) {
        baseFeatureInfoParams = Ext.apply(baseFeatureInfoParams, {
            X:clickPoint.x,
            Y:clickPoint.y,
            I:clickPoint.x,
            J:clickPoint.y
        });
    }

    baseFeatureInfoParams = Ext.apply(baseFeatureInfoParams, overrideParams);

    return this.unproxy(this.getFullRequestString(baseFeatureInfoParams));
};

OpenLayers.Layer.WMS.prototype.getFeatureInfoFormat = function () {
    if (this.isNcwms()) {
        // ignoring any bad user config. we know what we want here
        return 'text/xml';
    }
    else {
        // Should usually be 'text/html'
        return this.server.infoFormat;
    }
};

// formatFeatureInfoHtml may be overriden by sub classes (like NcWMS)
OpenLayers.Layer.WMS.prototype.formatFeatureInfoHtml = function (resp, options) {
    return formatGetFeatureInfo(resp, options);
};

OpenLayers.Layer.WMS.prototype.getFeatureRequestUrl = function (outputFormat) {

    var wfsUrl = this._getWfsServerUrl();
    var wfsLayerName = this._getWfsLayerName();

    wfsUrl += (wfsUrl.indexOf('?') !== -1) ? "&" : "?";
    wfsUrl += 'typeName=' + wfsLayerName;
    wfsUrl += '&SERVICE=WFS';
    wfsUrl += '&outputFormat=' + outputFormat;
    wfsUrl += '&REQUEST=GetFeature';
    wfsUrl += '&VERSION=1.0.0';

    if (this.getDownloadFilter()) {
        wfsUrl += '&CQL_FILTER=' + this.getDownloadFilter();
    }

    return wfsUrl;
};

OpenLayers.Layer.WMS.prototype._getWfsServerUrl = function() {

    if (!this.wfsLayer) {
        return null;
    }

    var layer = this.wfsLayer;
    var wmsUrl = layer.server.uri;
    var wfsUrl = wmsUrl.replace('/wms', '/wfs');

    return wfsUrl;
};

OpenLayers.Layer.WMS.prototype._getWfsLayerName = function() {

    if (!this.wfsLayer) {
        return null;
    }

    return this.wfsLayer.name;
};

OpenLayers.Layer.WMS.prototype.getMetadataUrl = function () {
    var result = undefined;

    if (this.overrideMetadataUrl) {
        result = this.overrideMetadataUrl;
    }
    else if (this.metadataUrls && this.metadataUrls.length > 0) {
        for (var i = 0; i < this.metadataUrls.length; i++) {
            //TC211 is meant for MCP
            if (this.metadataUrls[i].type == "TC211") {  //ideally there would be a MCP type in geoserver to compare with - rather than "other"
                return this.metadataUrls[i].onlineResource.href;
            }
        }
    }
    return result;
};

OpenLayers.Layer.WMS.prototype.proxy = function (proxy) {
    if (this.server.username && this.server.password && !this.localProxy) {
        var separator = (this.server.uri.indexOf("\?") !== -1) ? "&" : "?";
        this.server.uri = proxy + this.server.uri + separator;
        this.url = this.server.uri;
        this.localProxy = proxy;
    }
};

OpenLayers.Layer.WMS.prototype.unproxy = function (url) {
    return url.replace(this.localProxy, '');
};

OpenLayers.Layer.WMS.prototype._getBoundingBox = function () {
    var bounds = this._is130()
        ? new OpenLayers.Bounds.fromArray(this.getExtent().toArray(true))
        : this.getExtent();

    return bounds.toBBOX();
};

OpenLayers.Layer.WMS.prototype._is130 = function () {
    return this.server.type.contains("1.3.0") && !this.isNcwms();
};

OpenLayers.Layer.WMS.prototype.isAnimatable = function () {
    return false;
};

OpenLayers.Layer.WMS.prototype.getCqlFilter= function () {
    if (this.params["CQL_FILTER"]) {
        return this.params["CQL_FILTER"];
    }
    else {
        return "";
    }
};

OpenLayers.Layer.WMS.prototype.setCqlFilter = function (cqlFilter) {
    if (cqlFilter == this.getCqlFilter()) {
        return;
    }

    if (cqlFilter) {
        this.mergeNewParams({
            CQL_FILTER: cqlFilter
        });
    }
    else {
        delete this.params["CQL_FILTER"];
        this.redraw();
    }
};

OpenLayers.Layer.WMS.prototype.getDownloadFilter = function () {
    var filters = [];

    if (this.params.CQL_FILTER) {
        filters.push(this.params.CQL_FILTER);
    }

    if (this.downloadOnlyFilters) {
        filters.push(this.downloadOnlyFilters);
    }

    return filters.join(' AND ');
};

OpenLayers.Layer.WMS.prototype.hasBoundingBox = function () {
    return !Ext.isEmpty(this.bboxMinX) && !Ext.isEmpty(this.bboxMinY) && !Ext.isEmpty(this.bboxMaxX) && !Ext.isEmpty(this.bboxMaxY);
};

OpenLayers.Handler.Drag.prototype.mousedown = function (evt) {
    var propagate = true;
    this.dragging = false;
    if (this.checkModifiers(evt) && OpenLayers.Event.isLeftClick(evt)) {
        this.started = true;
        this.start = evt.xy;
        this.last = evt.xy;
        OpenLayers.Element.addClass(
            this.map.viewPortDiv, "olDragDown"
        );
        this.down(evt);
        this.callback("down", [evt.xy]);

        // Leaving this commented out code here so that one can see what's different to the original function.
        // This fixes bugs related to combo boxes not closing when the map is clicked (because the event never
        // propagates to other elements, i.e. the comboboxes).
//        OpenLayers.Event.stop(evt);

        if (!this.oldOnselectstart) {
            this.oldOnselectstart = (document.onselectstart) ? document.onselectstart : OpenLayers.Function.True;
        }
        document.onselectstart = OpenLayers.Function.False;

        propagate = !this.stopDown;
    }
    else {
        this.started = false;
        this.start = null;
        this.last = null;
    }
    return propagate;
};

OpenLayers.Layer.WMS.prototype.hasImgLoadErrors = function () {
    return Ext.DomQuery.jsSelect('img.olImageLoadError', this.div).length > 0;
};

// In IE8, the layer onload event was not being triggered as it was in other browsers when 
// there is an error loading an image.  This is due to the img element error handlers 
// not being executed in FIFO order in IE8.
// Override the initImgDiv method ensuring the onload event is triggered after the 
// onImageLoadError has been processed as is required for the correct operation 
// of these handlers.
    
OpenLayers.Tile.Image.prototype.initImgDiv = function() {
    var offset = this.layer.imageOffset; 
    var size = this.layer.getImageSize(this.bounds); 
     
    if (this.layerAlphaHack) {
        this.imgDiv = OpenLayers.Util.createAlphaImageDiv(null,
                                                       offset,
                                                       size,
                                                       null,
                                                       "relative",
                                                       null,
                                                       null,
                                                       null,
                                                       true);
    } else {
        this.imgDiv = OpenLayers.Util.createImage(null,
                                                  offset,
                                                  size,
                                                  null,
                                                  "relative",
                                                  null,
                                                  null,
                                                  true);
    }
        
    this.imgDiv.className = 'olTileImage';

    /* checkImgURL used to be used to called as a work around, but it
       ended up hiding problems instead of solving them and broke things
       like relative URLs. See discussion on the dev list:
       http://openlayers.org/pipermail/dev/2007-January/000205.html

    OpenLayers.Event.observe( this.imgDiv, "load",
        OpenLayers.Function.bind(this.checkImgURL, this) );
    */
    this.frame.style.zIndex = this.isBackBuffer ? 0 : 1;
    this.frame.appendChild(this.imgDiv); 
    this.layer.div.appendChild(this.frame); 

    if(this.layer.opacity != null) {
            
        OpenLayers.Util.modifyDOMElement(this.imgDiv, null, null, null,
                                         null, null, null, 
                                         this.layer.opacity);
    }

    // we need this reference to check back the viewRequestID
    this.imgDiv.map = this.layer.map;

    //bind a listener to the onload of the image div so that we 
    // can register when a tile has finished loading.
    var onload = function() {
            
        //normally isLoading should always be true here but there are some 
        // right funky conditions where loading and then reloading a tile
        // with the same url *really*fast*. this check prevents sending 
        // a 'loadend' if the msg has already been sent
        //
        if (this.isLoading) { 
            this.isLoading = false; 
            this.events.triggerEvent("loadend"); 
        }
    };
        
    if (this.layerAlphaHack) { 
        OpenLayers.Event.observe(this.imgDiv.childNodes[0], 'load', 
                                 OpenLayers.Function.bind(onload, this));    
    } else { 
        OpenLayers.Event.observe(this.imgDiv, 'load', 
                             OpenLayers.Function.bind(onload, this)); 
    } 
        

    // Bind a listener to the onerror of the image div so that we
    // can registere when a tile has finished loading with errors.
    var onerror = function() {

        // If we have gone through all image reload attempts, it is time
        // to realize that we are done with this image. Since
        // OpenLayers.Util.onImageLoadError already has taken care about
        // the error, we can continue as if the image was loaded
        // successfully.
        if (this.imgDiv._attempts > OpenLayers.IMAGE_RELOAD_ATTEMPTS) {
            onload.call(this);
        }
    };

    // In IE8 guarantee onerror runs after onImageLoadError by running it 
    // in a timer

    if (Ext.isIE8) {
        var that = this;

        OpenLayers.Event.observe(this.imgDiv, "error", function() {
            onerror.defer(1, that)
        });
    } else {
        OpenLayers.Event.observe(this.imgDiv, "error",
                                     OpenLayers.Function.bind(onerror, this));
    }
};
