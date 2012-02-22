Ext.namespace('Portal.snapshot');

Portal.snapshot.SnapshotController = Ext.extend(Ext.util.Observable, {
  constructor: function(config) {
    config = config || {};
    Ext.apply(this, config);
    
    this.addEvents({
      snapshotsChanged: true,
    });
    
    this.proxy = new Portal.snapshot.SnapshotProxy();
    
    Portal.snapshot.SnapshotController.superclass.constructor.apply(this, arguments);
  },
  
  createSnapshot: function(name, successCallback, failureCallback) {
    var bbox = this.map.getExtent().toArray();

    var snapshot = {
      owner: Portal.app.config.currentUser.id, 
      name: name, 
      minX: bbox[0], 
      minY: bbox[1],
      maxX: bbox[2],
      maxY: bbox[3],
      layers: []
    };

    var mapLayers = this.map.layers;

    for (var i=0; i < mapLayers.length; i++) {
      var snapshotLayer = this.getSnapshotLayer(mapLayers[i]);
      snapshot.layers.push(snapshotLayer);
    };

    this.proxy.save(snapshot, this.onSuccessfulSave.createDelegate(this,[successCallback],true), failureCallback);
  },

  onSuccessfulSave: function(snapshot, successCallback) {
    this.fireEvent('snapshotsChanged');
    
    if (successCallback) {
      successCallback(snapshot);
    }
  },
  
  loadSnapshot: function(id, successCallback, failureCallback) {
    this.proxy.get(id, this.onSuccessfulLoad.createDelegate(this,[successCallback],true), failureCallback);
  },
  
  onSuccessfulLoad: function(snapshot, successCallback) {
    removeAllLayers();
    
    var bounds = new OpenLayers.Bounds(snapshot.minX, snapshot.minY, snapshot.maxX, snapshot.maxY);
    
    this.map.zoomToExtent(bounds, true);
    
    for (var i=0; i< snapshot.layers.length; i++) {
      this.addSnapshotLayer(snapshot.layers[i]);
    }
    
    if (successCallback) {
      successCallback(snapshot);
    }
  },
  
  deleteSnapshot: function(id, successCallback, failureCallback) {
    this.proxy.remove(id, this.onSuccessfulDelete.createDelegate(this,[successCallback]), failureCallback);
  },
  
  onSuccessfulDelete: function(successCallback) {
    this.fireEvent('snapshotsChanged');
    
    if (successCallback) {
      successCallback();
    }
  },
  
  // private functions
  
  getSnapshotLayer: function(mapLayer) {
    var layer = {};
    if (mapLayer.grailsLayerId) {
      // layers sourced from server
      layer.layer = mapLayer.grailsLayerId;
    } else if (mapLayer.originalWMSLayer != undefined) {
      // animated layers - save original layer details plus animation settings
      layer.layer = mapLayer.originalWMSLayer.grailsLayerId;
      layer.animated = true;
      layer.chosenTimes = mapLayer.originalWMSLayer.chosenTimes; 
      layer.styles = mapLayer.originalWMSLayer.params.STYLES;
    } else {
      // layers added from search
      layer.name = mapLayer.params.LAYERS;
      layer.title = mapLayer.name;
      layer.serviceUrl = mapLayer.server.uri;
    }
    if (layer.opacity != undefined) {
      layer.opacity = mapLayer.opacity;
    }
    if (mapLayer.params != undefined) {
      layer.styles = mapLayer.params.STYLES;
    }
    layer.isBaseLayer= mapLayer.isBaseLayer;
    // using hidden as per OGC WMC spec but visible may make more sense!
    layer.hidden= !mapLayer.getVisibility();
    return layer;
  },
  
  addSnapshotLayer: function(snapshotLayer) {
    var options = {
        visibility: !snapshotLayer.hidden,
    };
    
    if (snapshotLayer.opacity) {
      options.opacity = snapshotLayer.opacity;
    };
    
    var params = {
        styles: snapshotLayer.styles
    };
    
    if (snapshotLayer.isBaseLayer) {
      if (!snapshotLayer.hidden) {
        // find and display baselayer if it still exists
        var matchingLayers = this.map.getLayersBy("grailsLayerId", snapshotLayer.layer.id);
        if (matchingLayers.length > 0) this.map.setBaseLayer(matchingLayers[0]);          
      }
    } else {
      if (snapshotLayer.layer) {
        addGrailsLayer(snapshotLayer.layer.id, options, params, snapshotLayer.animated, snapshotLayer.chosenTimes);
      } else {
        var layerDef = this.getLayerDef(snapshotLayer);
        addMainMapLayer(layerDef, options, params);
      }
    }
  },
  
  getLayerDef: function(snapshotLayer) {
    return   {
      title: snapshotLayer.title,
      server: {
        uri: snapshotLayer.serviceUrl,
        type: 'WMS'
      },
      name: snapshotLayer.name
    };
  }
  
});