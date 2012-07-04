Ext.namespace('Portal.ui');



Portal.ui.Options = Ext.extend(Object, {
	
	constructor: function(cfg) {
		var config = Ext.apply({}, cfg);
		Portal.ui.Options.superclass.constructor.call(this, config);
		
		Ext.QuickTips.init();
		
		var container = document.getElementById("navtoolbar");                
                
		var pan = new OpenLayers.Control.Navigation({
			title: 'Pan Control'
		} );
		var zoom = new OpenLayers.Control.ZoomBox({
			title: "Zoom and centre [shift + mouse drag]"
		});
		var toolPanel = new OpenLayers.Control.Panel({
			defaultControl: pan,
			div: container
		});
		toolPanel.addControls( [ zoom,pan] );
		
		this.controls = [
		new OpenLayers.Control.Navigation(),
		new OpenLayers.Control.Attribution(),
		new OpenLayers.Control.PanZoomBar(),
		new OpenLayers.Control.MousePosition(),
		new OpenLayers.Control.ScaleLine(),
		new OpenLayers.Control.NavigationHistory(),
		new OpenLayers.Control.OverviewMap({
			autoPan: true,
			minRectSize: 30,
			mapOptions:{
				resolutions: [0.3515625, 0.17578125, 0.087890625, 0.0439453125, 0.02197265625, 0.010986328125, 0.0054931640625, 0.00274658203125, 0.001373291015625, 0.0006866455078125, 0.00034332275390625,  0.000171661376953125]
			}
		}),
		toolPanel
		];
		
		this.options = {
			controls: this.controls,
			displayProjection: new OpenLayers.Projection("EPSG:4326"),
			prettyStateKeys: true, // for pretty permalinks,
			resolutions: [  0.17578125, 0.087890625, 0.0439453125, 0.02197265625, 0.010986328125, 0.0054931640625, 0.00274658203125, 0.001373291015625, 0.0006866455078125, 0.00034332275390625,  0.000171661376953125]
		};
	}	
});

OpenLayers.Control.Click = OpenLayers.Class(OpenLayers.Control, {               
	defaultHandlerOptions: {
		'single': true,
		'double': true,
		'pixelTolerance': 0,
		'stopSingle': false,
		'stopDouble': false
	},

	initialize: function(options) {
		this.handlerOptions = OpenLayers.Util.extend(
		{}, this.defaultHandlerOptions
			);
		OpenLayers.Control.prototype.initialize.apply(
			this, arguments
			);
		this.handler = new OpenLayers.Handler.Click(
			this, {
				'click': this.onClick
			}, this.handlerOptions
			);
	},

	onClick: function(evt) {}

});

Portal.ui.Map = Ext.extend(Portal.common.MapPanel, {
	
	constructor: function(cfg) {
		
		this.appConfig = cfg.appConfig;
		
		// Stop the pink tiles appearing on error
		OpenLayers.Util.onImageLoadError = function(e) {
			this.style.display = "";
			this.src = "img/blank.png";
		};

		this.initMap();
		
		var config = Ext.apply({
			id: "map",
			region: "center",
			split: true,
			header: false,
			initialBbox: this.appConfig.initialBbox,
			autoZoom: this.appConfig.autoZoom,
			hideLayerOptions: this.appConfig.hideLayerOptions,
			activeLayers: {},
			layersLoading: 0
		}, cfg);
        
		Portal.ui.Map.superclass.constructor.call(this, config);
		this.initMapLinks();

		
		var clickControl = new OpenLayers.Control.Click({
			map: this.map,
			appConfig: this.appConfig,
			fallThrough: false,
			scope: this,
			onClick: function(event) {
				this.scope._handleFeatureInfoClick(event);
			}
		});
		
		
		this.map.addControl(clickControl);
		clickControl.activate();

	    
		this.spinnerForLayerloading = new Spinner({
			lines: 12, // The number of lines to draw
			length: 16, // The length of each line
			width: 4, // The line thickness
			radius: 12, // The radius of the inner circle
			color: '#CCC', // #rgb or #rrggbb
			speed: 1, // Rounds per second
			trail: 60, // Afterglow percentage
			shadow: true // Whether to render a shadow
		});
	    
		this.on('hide', function() {
			// map is never hidden!!!!"
			this.updateLoadingImage("none");
			this._closeFeatureInfoPopup();
		}, this);
	    
		this.on('baselayersloaded', this.onBaseLayersLoaded, this);
	    
		this.addEvents('baselayersloaded', 'layeradded', 'tabchange');
		this.bubbleEvents.push('baselayersloaded');
		this.bubbleEvents.push('layeradded');
        
		this.addBaseLayers();
		
		this.on('afterlayout', function() {
			// cursor mods
			//this.style.cursor="pointer";
			jQuery("div.olControlZoomBoxItemInactive ").click(function(){
				//this.style.cursor="crosshair";
				clickControl.deactivate();
			});
			jQuery("div.olControlNavigationItemActive ").click(function(){
				//this.style.cursor="pointer";
				clickControl.activate();
			});
		}, this);
		
		this.on('tabchange', function() {
			this._closeFeatureInfoPopup();
		}, this);


		// make sure layer store reflects loaded layers
		// even if the map hasn't been rendered yet
		this.layers.bind(this.map);
	},
	
	_handleFeatureInfoClick: function(event) {
		this._closeFeatureInfoPopup();
		this._findFeatureInfo(event);
	},
	
	_closeFeatureInfoPopup: function() {
		if (this.featureInfoPopup) {
			this.featureInfoPopup.close();
		}
	},
	
	_findFeatureInfo: function(event) {
		this.featureInfoPopup = new Portal.ui.FeatureInfoPopup({
			map: this.map, 
			appConfig: this.appConfig
		});
		this.featureInfoPopup.findFeatures(event);
	},
    
	initMap: function() {
		this.mapOptions = new Portal.ui.Options();
		this.map = new OpenLayers.Map(this.mapOptions.options);
		this.map.restrictedExtent = new OpenLayers.Bounds.fromArray([null, -90, null, 90]);
		// keep the animated image crisp
		// limit to changes in zoom. moveend is too onerous
		this.map.events.register("moveend", this, function (e) {        
			this.redrawAnimatedLayers();
		});
	},
	
	
	
	initMapLinks: function() {
		
		this.animationPanel = new Portal.details.AnimationPanel();
		
		this.controlButton = new Ext.FormPanel({				
			padding: "10 5 10 5",
			items: [{
				xtype: 'button',
				id: 'controlButton',				
				cls: 'fullTransparency',
				text: OpenLayers.i18n('controlButton_4animationPanel'),
				listeners:{
					// stops the click bubbling to a getFeatureInfo request on the map
					scope: this,
					click: this.toggleMapLinks
				}
			}]
		});


		this.mapToolbar = new Ext.Toolbar({
			id: 'maptools',
			height: '100%',
			width: '100%',
			cls: 'semiTransparent',
			defaults: {	
				bodyStyle:'padding:5px'
			},
			unstyled: true,
			items: [				
			{
				xtype: 'tbspacer', 
				width: 300
			}, 
			this.animationPanel,
			{
				xtype: 'tbspacer', 
				width: 3
			}//, 
			//this.controlButton,
			],
			listeners:{
				// stops the click bubbling to a getFeatureInfo request on the map
				scope: this,
				render: function(p){
					p.getEl().on('click', this.eventStopper);
					p.getEl().on('dblclick', this.eventStopper);
					p.getEl().on('mouseenter', function(){
						//parent._expandMapLinks();
					});
					p.getEl().on('mouseleave', function(){
						//parent._contractMapLinks();
					});
				},
				single: true  // Remove the listener after first invocation
			}
		});
		
		
		this.maplinksHeight = 52;

		this.expandBar = this.initToolBarExpanderBar();

		var parent = this;
		this.mapLinks = new Ext.Panel({
			id: "mapLinks",
			shadow: false,
			width: '100%',
			height: this.maplinksHeight,
			closeAction: 'hide',
			floating: true,
			unstyled: true,
			items: [
			this.expandBar,
			this.mapToolbar
			]
		});

		this.mapLinks.setPosition(1, 0); // override with CSS later
		//this.controlButton.setPosition(-1, 0); // override with CSS later
		this.add(this.mapLinks);
	},

	_contractMapLinks: function(){
		this.mapLinks.setHeight(this.maplinksHeight);
		this.expandBar.addClass("expandUpLink");
		this.expandBar.removeClass("expandDownLink");
	},

	_expandMapLinks: function(){
		this.mapLinks.setHeight(270);
		this.expandBar.addClass("expandDownLink");
		this.expandBar.removeClass("expandUpLink");
	},
	
	toggleMapLinks: function() {
		
		if (this.mapLinks.getHeight() > this.maplinksHeight) {
			this._contractMapLinks();
		}
		else {
			this._expandMapLinks();
		}
	},
		
	initToolBarExpanderBar: function() {
		var parent = this;		
		var toolbar = new Ext.Toolbar({
			id: 'mapToolbarExpanderBar',
			qtip: "This is a tip",
			height: 10,
			width: '100%',
			cls: 'semiTransparent noborder expandUpLink link',
			overCls: "mapToolbarExpanderBarOver",
			unstyled: true,
			listeners:{
				//scope: this,
				render: function(bar) {
					bar.getEl().on('click', function(ev) {
						parent.toggleMapLinks();
						ev.stopPropagation();
					});
				}
			}
		});
		return toolbar;
	},
	
	
	eventStopper: function(ev) {
		//console.log(ev.type);
		ev.stopPropagation(); // Cancels bubbling of the event
	},
	
	addBaseLayers: function() {
		if (this.baseLayersLoaded || this.baseLayersLoading) {
			return;
		}
		this.baseLayersLoading = true;

		Ext.Ajax.request({
			url: 'layer/configuredbaselayers',
			scope: this,
			success: function(resp, opts) {        
				var layerDescriptors = Ext.util.JSON.decode(resp.responseText);
				Ext.each(layerDescriptors, 
					function(layerDescriptor, index, all) {
						layerDescriptor.isBaseLayer = true;
						layerDescriptor.queryable = false;
						this.map.addLayer(this.getOpenLayer(layerDescriptor));
					},
					this
					);
				delete this.baseLayersLoading;
				this.baseLayersLoaded = true;
				this.fireEvent('baselayersloaded');
			}
		});
	},
	
	onBaseLayersLoaded: function() {
		this.addDefaultLayers();
	},
	
	addDefaultLayers: function() {
		if (this.defaultLayersLoaded || this.defaultLayersLoading) {
			return;
		}
		this.defaultLayersLoading = true;
		Ext.Ajax.request({
			url: 'layer/defaultlayers',
			scope: this,
			success: function(resp, opts) {        
				var layerDescriptors = Ext.util.JSON.decode(resp.responseText);
				Ext.each(layerDescriptors, 
					function(layerDescriptor, index, all) {
						this._addLayer(this.getOpenLayer(layerDescriptor), true);
					},
					this
					);
				// TODO tommy move to portal panel or another higher UI
				jQuery('.extAjaxLoading').hide('slow');
				// Zoom to the top most layer if autoZoom is enabled
				if (this.autoZoom === true) {
					this.zoomToLayer(this.map.layers[this.map.layers.length - 1]);
				}
				this.defaultLayersLoaded = true;
				delete this.defaultLayersLoading;
				this.fireEvent('defaultlayersloaded');
			}
		});
	},
	
	getServer: function(item) {
		return item.server;
	},

	getServerImageFormat: function (server) {
		if (server) {
			if (server.imageFormat) {
				return server.imageFormat;
			}
			return 'image/png';
		}
		return undefined;
	},
	
	getWmsVersionString: function(server) {
		// list needs to match Server.groovy
		var versionList = ["1.0.0","1.0.7","1.1.0","1.1.1","1.3.0"];
		for(var i = 0; i < versionList.length; i++){
			if (server.type.indexOf(versionList[i]) != -1) {
				return versionList[i];
			}
		}
		return "undefined";
	},
	
	getServerOpacity: function(server) {
		var opacity = server.opacity ? server.opacity : 100;
		return Math.round((opacity / 100)*10)/10;
	},
	
	getOpenLayerOptions: function(layerDescriptor, overrides) {
		var options = {
			wrapDateLine: true,   
			opacity: this.getServerOpacity(this.getServer(layerDescriptor)),
			version: this.getWmsVersionString(this.getServer(layerDescriptor)),
			transitionEffect: 'resize',
			isBaseLayer: layerDescriptor.isBaseLayer,
			buffer: 1, 
			gutter: 0,
			projection: new OpenLayers.Projection(layerDescriptor.projection)
		};
		if (overrides) {
			Ext.apply(options, overrides);
		}
		return options;
	},
	
	getOpenLayerParams: function(layerDescriptor, overrides) {
				
		if(layerDescriptor.namespace != null) {
			layerDescriptor.name = layerDescriptor.namespace + ":" + layerDescriptor.name;
		}
		var params = {
			layers: layerDescriptor.name,
			transparent: 'TRUE',
			version: this.getWmsVersionString(this.getServer(layerDescriptor)),
			format: this.getServerImageFormat(this.getServer(layerDescriptor)),
			CQL_FILTER: layerDescriptor.cql,
			EXCEPTIONS: 'application/vnd.ogc.se_xml',
			queryable: layerDescriptor.queryable
		};
		if (overrides) {
			Ext.apply(params, overrides);
		}
		return params;
	},
	
	getUri: function(server) {
		return server.uri;
	},
	
	getServerUri: function(layerDescriptor) {
		var serverUri = this.getUri(this.getServer(layerDescriptor));
		if (layerDescriptor.cache == true) {
			serverUri = window.location.href + proxyCachedURL + encodeURIComponent(serverUri);         
		}
		return serverUri;
	},
  
	getParent: function(layerDescriptor) {
		return layerDescriptor.parent;
	},
	
	getParentId: function(layerDescriptor) {
		if (this.getParent(layerDescriptor)) {
			return this.getParent(layerDescriptor).id;
		}
	},
	
	getParentName: function(layerDescriptor) {
		if (this.getParent(layerDescriptor)) {
			return this.getParent(layerDescriptor).name;
		}
	},
	
	setDomainLayerProperties: function(openLayer, layerDescriptor) {
		openLayer.grailsLayerId = layerDescriptor.id;
		openLayer.server= layerDescriptor.server;

		//injecting credentials for authenticated WMSes.  Openlayer doesn;t
		//provide a way to add header information to a WMS request
		if(openLayer.server.username && openLayer.server.password){
			splitAtProtocol = openLayer.server.uri.split("://");
			if(splitAtProtocol.length == 2){
				//cringe! But had the blessings from management to add this
				openLayer.server.uri = splitAtProtocol[0] + "://" + openLayer.server.username + ":" +
				openLayer.server.password + "@" + splitAtProtocol[1];
				openLayer.url = openLayer.server.uri;
			}
		}

		openLayer.cql = layerDescriptor.cql;  
		openLayer.bboxMinX = layerDescriptor.bboxMinX;
		openLayer.bboxMinY = layerDescriptor.bboxMinY;
		openLayer.bboxMaxX = layerDescriptor.bboxMaxX;
		openLayer.bboxMaxY = layerDescriptor.bboxMaxY;
		openLayer.cache = layerDescriptor.cache;
		openLayer.projection = layerDescriptor.projection;
		openLayer.blacklist = layerDescriptor.blacklist;
		openLayer.abstractTrimmed = layerDescriptor.abstractTrimmed;
		openLayer.metadataUrls = layerDescriptor.metadataUrls;
		openLayer.overrideMetadataUrl = layerDescriptor.overrideMetadataUrl;
		openLayer.parentLayerId = this.getParentId(layerDescriptor);
		openLayer.parentLayerName = this.getParentName(layerDescriptor);
		openLayer.allStyles = layerDescriptor.styles;
		openLayer.dimensions = layerDescriptor.dimensions;
		openLayer.layerHierarchyPath = layerDescriptor.layerHierarchyPath;
	},
	
	getWmsOpenLayerUri: function(originalWMSLayer) {
		return this.getUri(this.getServer(originalWMSLayer));
	},
	
	getLayerUid: function(openLayer) {
		// layerHierarchyPath is the preferred unique identifier for a layer
		if ( openLayer.layerHierarchyPath ) return openLayer.layerHierarchyPath;

		var uri = "UNKNOWN";
		var server = openLayer.server;

		if (server) {
			uri = server.uri;
		}
		else {
			// may currently be an animating layer 
			if (openLayer.originalWMSLayer) {
				uri = this.getWmsOpenLayerUri(openLayer.originalWMSLayer);
			}
			else if(openLayer.url) {
				uri = openLayer.url;
			}
		}

		return uri + "::" +  openLayer.name + (openLayer.cql ? '::' + openLayer.cql : '');
	},
	
	containsLayer: function(openLayer) {
		var previousLayer = this.activeLayers[this.getLayerUid(openLayer)];
		if (!previousLayer) {
			return false;
		}
		return this.map.getLayer(previousLayer.id) !== null;
	},
	
	getOpenLayer: function(layerDescriptor, optionOverrides, paramOverrides) {
		var server = layerDescriptor.server;
		var options = this.getOpenLayerOptions(layerDescriptor, optionOverrides);
	    
		var openLayer = new OpenLayers.Layer.WMS(
			layerDescriptor.title,
			this.getServerUri(layerDescriptor),
			this.getOpenLayerParams(layerDescriptor, paramOverrides),
			options
			);
		this.setDomainLayerProperties(openLayer, layerDescriptor);
	    
		// don't add layer twice 
		if (this.containsLayer(openLayer)) {
			Ext.Msg.alert(OpenLayers.i18n('layerExistsTitle'), OpenLayers.i18n('layerExistsMsg'));
			return;
		}
		return openLayer;
	},
	
	waitForDefaultLayers: function(openLayer, showLoading) {
		this.on('defaultlayersloaded', function() {
			this.addLayer(openLayer, showLoading);
		}, this);
	},

	updateAnimationPanel: function(openLayer){
		if(!this.animationPanel.isAnimating()){
			if(openLayer.isAnimatable()){
				//show the panel for the first time!
				this.animationPanel.setVisible(true);
				this.animationPanel.setSelectedLayer(openLayer);
				this.animationPanel.update();
			}
			else{
				this.animationPanel.setVisible(false);
			}
		}
	},

	addLayer: function(openLayer, showLoading) {
		this.updateAnimationPanel(openLayer);
		if (!this.containsLayer(openLayer) || (openLayer.isAnimated == true)) {
			if (!this.defaultLayersLoaded) {
				this.waitForDefaultLayers(openLayer, showLoading);
			}
			else {
				this._addLayer(openLayer, showLoading);
			}
		}
	},
	
	_addLayer: function(openLayer, showLoading) {
		if (showLoading === true) {
			this.registerLayer(openLayer);
		}
		this.map.addLayer(openLayer);
		this.activeLayers[this.getLayerUid(openLayer)] = openLayer;
		this.fireEvent('layeradded', openLayer);
		if (!openLayer.isBaseLayer) {
			// Hides the text above the active layers
			jQuery('.emptyActiveLayerTreePanelText').hide('slow');
		}
	},
	
	redrawAnimatedLayers: function() {
		var wmsLayers = this.map.getLayersByClass("OpenLayers.Layer.WMS");
		// interesting the animated images are not appearing to be of the class OpenLayers.Layer.Image
		for(var i = 0; i < wmsLayers.length; i++)   {   
			if (this.map.layers[i].id !== undefined) {
				var layer = this.map.getLayer(this.map.layers[i].id);       
				if (layer.originalWMSLayer !== undefined) {
					// redraw
					this.addNCWMSLayer(layer);
				}
			}
		}

	},
	
	// exchange OpenLayers.Layer.WMS with OpenLayers.Layer.Image 
	// or reload OpenLayers.Layer.Image
	// Reloading may be called from reloading a style or changing zoomlevel
	addNCWMSLayer: function(currentLayer) {
		// Because of the way the ncWMS layer is generated there's not much point
		// attaching to its load start/end event so we can manually call those
		// actions here
		this.loadStart();

		var bbox = this.getMapExtent();
		var layer = currentLayer;

		// if originalWMSLayer is set - then it is already an animated Image
		if (currentLayer.originalWMSLayer !== undefined) {
			layer = currentLayer.originalWMSLayer;
			layer.map = this.map;
		}

		var newUrl = layer.getFullRequestString({
			TIME: layer.chosenTimes,
			TRANSPARENT: true,
			STYLE: layer.params.STYLES, // use the style of the original WMS layer
			WIDTH: 1024,
			HEIGHT: 1024,
			BBOX: bbox.toArray(),
			FORMAT: "image/gif"
		});

		var newNCWMS = new OpenLayers.Layer.Image(
			layer.name + " (Animated)",
			newUrl,
			bbox,
			bbox.getSize(), 
			{
				format: 'image/gif', 
				opacity: layer.server.opacity / 100,
				isBaseLayer : false,
				maxResolution: this.map.baseLayer.maxResolution,
				minResolution: this.map.baseLayer.minResolution,
				resolutions: this.map.baseLayer.resolutions
			}
			);

		newNCWMS.events.register('loadend', this, this.loadEnd);

		if (!this.getServer(newNCWMS)) {
			newNCWMS.server = this.getServer(layer);
		}
		if (!newNCWMS.params) {
			newNCWMS.params = layer.params;
		}
		else {
			newNCWMS.params.STYLES = layer.params.STYLES;
		}

		/********************************************************
			 * attach the old WMS layer to the new Image layer !!
			 * if this is set we know its an animated layer
			 * ******************************************************/
		newNCWMS.originalWMSLayer = layer;

		/*******************************************************
			 * add to map is done here
			 * swap in the new animating layer into openlayers
			 * keeping the layer position
			 *******************************************************/
		this.swapLayers(newNCWMS, currentLayer);

	},
	
	getMapExtent: function()  {
		var bounds = this.map.getExtent();
		var maxBounds = this.map.maxExtent;
		var top = Math.min(bounds.top, maxBounds.top);
		var bottom = Math.max(bounds.bottom, maxBounds.bottom);
		var left = Math.max(bounds.left, maxBounds.left);
		var right = Math.min(bounds.right, maxBounds.right);
		return new OpenLayers.Bounds(left, bottom, right, top);
	},
	
	swapLayers: function(newLayer, oldLayer) { 
		// exchange new for old  
		var layerLevelIndex = this.map.getLayerIndex(oldLayer);
		var oldLayerId = this.getLayerUid(oldLayer);   
		if (this.activeLayers[oldLayerId] !== undefined) {
			this.map.removeLayer(this.activeLayers[oldLayerId]);    
			// now that removeLayer has removed the old item in the activeLayers array, swap in the new layer
			this.addLayer(newLayer);
			this.map.setLayerIndex(newLayer, layerLevelIndex);
		} 
	    
		Ext.getCmp('rightDetailsPanel').update(newLayer);
	},
	
	zoomToLayer: function(openLayer) {
		if (openLayer) {
			if (this.hasBoundingBox(openLayer)) {
				// build openlayer bounding box            
				var bounds = new OpenLayers.Bounds(openLayer.bboxMinX, openLayer.bboxMinY, openLayer.bboxMaxX, openLayer.bboxMaxY);            
				// ensure converted into this maps projection. convert metres into lat/lon etc
				bounds.transform(new OpenLayers.Projection(openLayer.projection), this.map.getProjectionObject()); 
	            
				// openlayers wants left, bottom, right, top             
				// dont support NCWMS-1.3.0 until issues resolved http://www.resc.rdg.ac.uk/trac/ncWMS/ticket/187        
				if(this.getServer(openLayer).type == "WMS-1.3.0") { 
					bounds =  new OpenLayers.Bounds.fromArray(bounds.toArray(true));
				}            
	            
				if (bounds) {
					this.zoomTo(bounds);
				} 
			}
		}
	},
	
	hasBoundingBox: function(openLayer) {
		return !Ext.isEmpty(openLayer.bboxMinX) && !Ext.isEmpty(openLayer.bboxMinY) && !Ext.isEmpty(openLayer.bboxMaxX) && !Ext.isEmpty(openLayer.bboxMaxY);
	},
	
	zoomTo: function(bounds, closest) {
		if((Math.abs(bounds.left - bounds.right) < 1) && (Math.abs(bounds.top == bounds.bottom) < 1)){
			this.map.setCenter(bounds.getCenterLonLat(), 3);
		}
		else{
			this.map.zoomToExtent(bounds, closest);
		}
	},
	
	addGrailsLayer: function (id, layerOptions, layerParams, animated, chosenTimes) {   
	    
		Ext.Ajax.request({

			url: 'layer/showLayerByItsId?layerId=' + id,
			layerOptions: layerOptions,
			layerParams: layerParams,
			animated: animated,
			chosenTimes: chosenTimes,
			scope: this,
			success: function(resp, options) {
				var layerDescriptor = Ext.util.JSON.decode(resp.responseText);  
				if (layerDescriptor) {
					layerDescriptor.isNcwms = function() {
						
					}
					this.addMapLayer(layerDescriptor, options.layerOptions, options.layerParams, animated, chosenTimes);
				}
			},
			failure: function(resp) {
				Ext.MessageBox.alert('Error', "Sorry I could not load the requested layer:\n" + resp.responseText);
			}
		});
	},

	addExternalLayer: function(layerDescriptor) {
		var serverUri = this.getServerUri(layerDescriptor);

		Ext.Ajax.request({
			url: 'layer/findLayerAsJson?serverUri=' + serverUri + '&name=' + layerDescriptor.name,
			scope: this,
			success: function(resp) {
				var grailsDescriptor = Ext.util.JSON.decode(resp.responseText);  
				if (grailsDescriptor) {
					this.addMapLayer(grailsDescriptor);
				}
			},
			failure: function(resp) {
				this.addMapLayer(layerDescriptor);
			}
		});
	},
	
	addMapLayer: function(layerDescriptor, layerOptions, layerParams, animated, chosenTimes) {
		var openLayer = this.getOpenLayer(layerDescriptor, layerOptions, layerParams);
		if (openLayer) {
			this.addLayer(openLayer, true);
			// zoom map first. may request less wms tiles first off
			if (this.autoZoom === true) {
				this.zoomToLayer(openLayer);
			}


			if (openLayer.isNcwms()) {
				// update detailsPanel after Json request
				this.getLayerMetadata(openLayer);
			}

			Ext.getCmp('rightDetailsPanel').update(openLayer);


			if (animated) {
				openLayer.chosenTimes = chosenTimes;
				this.addNCWMSLayer(openLayer);
			}
		}
	},

	getLayerMetadata: function(openLayer) {
		if (openLayer.params.LAYERS) {
			var url = proxyURL + encodeURIComponent(openLayer.url + "?item=layerDetails&layerName=" + openLayer.params.LAYERS + "&request=GetMetadata");
			// see if this layer is flagged a 'cached' layer. a Cached layer is allready requested through our proxy
			if (openLayer.cache === true) {
				// all parameters passed along here will get added to URL
				url = proxyCachedURL + encodeURIComponent(getUri(getServer(openLayer))) + "&item=layerDetails&layerName=" + openLayer.params.LAYERS + "&request=GetMetadata";
			}

			Ext.Ajax.request({
				url: url,
				success: function(resp) {
					openLayer.metadata = Ext.util.JSON.decode(resp.responseText);
					// if this layer has been user selected before loading the metadata
					// reload,  as the date picker details/ form  will be wrong at the very least!
					Ext.getCmp('rightDetailsPanel').update(openLayer);
				}
			});
		}
	    	    
		return false;
	},
	
	removeLayer: function(openLayer, newDetailsPanelLayer) {
		if (openLayer.name != 'OpenLayers.Handler.Path') {

			this.map.removeLayer(openLayer, newDetailsPanelLayer);

			delete this.activeLayers[this.getLayerUid(openLayer)];

			if (newDetailsPanelLayer == null) {
				Ext.getCmp('rightDetailsPanel').collapseAndHide(); //Hide details panel if there are no active layers
			} else {
				Ext.getCmp('rightDetailsPanel').update(newDetailsPanelLayer); //Show one of the remaining active layers
			}
		}
	},
	
	removeAllLayers: function() {
		// Need to collect the layers first and delete outside a loop over
		// the map.layers property because it updates its internal indices and
		// accordingly skips layers as the loop progresses
		var layersToRemove = [];
		Ext.getCmp("animationPanel").removeAnimation();

		Ext.each(this.map.layers, function(openLayer, allLayers, index) {
			if(openLayer && !openLayer.isBaseLayer) {
				layersToRemove.push(openLayer);
			}
		}, this);
		this.removeAllLayersIn(layersToRemove);
		
		Ext.getCmp('rightDetailsPanel').selectedLayer = null;
		Ext.getCmp('rightDetailsPanel').collapseAndHide();  // nothing to see now
		this._closeFeatureInfoPopup();
	},
	
	removeAllLayersIn: function(openLayers) {
		Ext.each(openLayers, function(openLayer, allLayers, index) {
			this.removeLayer(openLayer, null);
		}, this);
	},
	
	getLayerText: function(layerCount) {
		return layerCount === 1 ? "Layer" : "Layers";
	},
	
	getLayersLoadingText: function(layerCount) {
		return layerCount === 0 ? "" : layerCount.toString();
	},
	
	registerLayer: function(openLayer) {
		openLayer.events.register('loadstart', this, this.loadStart);
		openLayer.events.register('loadend', this, this.loadEnd);
	},

	buildLayerLoadingString: function(layerCount) {
		return "Loading " + this.getLayersLoadingText(layerCount) +"  " + this.getLayerText(layerCount) + "\u2026";
	},

	loadStart: function() {
		if (this.layersLoading == 0) {
			this.updateLoadingImage("block");
		}
		this.layersLoading += 1;
		jQuery("#loader p").text(this.buildLayerLoadingString(this.layersLoading));
	},

	loadEnd: function() {
		this.layersLoading -= 1;
		this.layersLoading = Math.max(this.layersLoading, 0);
		jQuery("#loader p").text(this.buildLayerLoadingString(this.layersLoading));
		if (this.layersLoading == 0) {
			if (this.spinnerTimeOut) {
				clearTimeout(this.spinnerTimeOut);
				delete this.spinnerTimeOut;
			}
			this.updateLoadingImage("none");
		}
	},

	updateLoadingImage: function(display) {
		if (display == "none" || !this.isVisible()) {
			jQuery("#loader").hide('slow');
		}
		else {
			if (this.layersLoading >= 0) {
				var spinner = this.spinnerForLayerloading;
				this.spinnerTimeOut = setTimeout(function() {
					jQuery("#loader").show();
					spinner.spin(jQuery("#jsloader").get(0));
				}, 2000);
			}
		}
	},

	stopAnimation: function(openLayer) {
		// if originalWMSLayer is set then it is an animated Openlayers.Image
		//if(openLayer.numLoadingTiles > 0)
		//	this.loadEnd();

		if (openLayer.originalWMSLayer !== undefined) {
			// get back the plain wms layer
			this.swapLayers(openLayer.originalWMSLayer, openLayer);
		}
	}
});
