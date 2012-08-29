Ext.namespace('Portal.ui');

//TODO: add something here to hide/show 'no layer selected' if there are no active layers on the map
Portal.ui.RightDetailsPanel = Ext.extend(Ext.Panel, {
	
	constructor: function(cfg) {
    	var config = Ext.apply({
    		id: 'rightDetailsPanel',
    		region: 'east',
    		title: OpenLayers.i18n('noActiveLayersSelected'),
    		//collapsed: true,
    		stateful: false,
    		padding:  '10px 10px 5px 20px',
    		split: true,
    		width: 350,
    		minWidth: 250,
    		layout: 'fit'
    	}, cfg);
        
        Portal.ui.RightDetailsPanel.superclass.constructor.call(this, config);
    },

	// check whether the panel has been rendered before calling the default expand method
	expand: function() {
	  if (this.rendered) {  	
		Portal.ui.RightDetailsPanel.superclass.expand.call(this, arguments);
	  }
	},
	expandFinished: function() {
		
		// should always be set, but a user could open the panel before adding layers!!		
		if (this.selectedLayer != null) {
			this.detailsPanelItems.updateDetailsPanel(this.selectedLayer,true);
		}		
	},

	initComponent: function(){
		this.detailsPanelItems = new Portal.details.DetailsPanel();
		this.selectedLayer = null;
		this.lockedPanel = false;
		
	    this.items = [
			this.detailsPanelItems
		];
		
		this.detailsPanelItems.hideDetailsPanelContents();
        Portal.ui.RightDetailsPanel.superclass.initComponent.call(this);		
		this.on("expand",this.expandFinished,this);
		
	},

	getDetailsPanelItems: function(){
		return this.detailsPanelItems;
	},

	setSelectedLayer: function(openLayer){
		this.selectedLayer = openLayer;
	},
	
	_onChangeLayer: function(evt)
	{
		console.log("layer changed");
		if(evt.layer==this.selectedLayer)
		{
			this.update(evt.layer);
		}
	},
	// a new layer has been added or selected
	update: function(openlayer){
		this.selectedLayer = openlayer;
		openlayer.map.events.on({
			"changelayer" : this._onChangeLayer,
			scope : this
		});
		
		this.text = openlayer.name;
		this.setTitle(openlayer.name);
		
		// show new layer details unless user requested 'hideLayerOptions' or
		// || !viewport.isMapVisible() check if the map is still in focus - not the search
		if (!(Portal.app.config.hideLayerOptions === true  )) {
			
			if(this.collapsed ) {
				// will updateDetailsPanel after expand					
				this.expand();
			}
			else {
				this.detailsPanelItems.updateDetailsPanel(openlayer);
			}
		}
		else {
			this.detailsPanelItems.updateDetailsPanel(openlayer);
			this.collapse(true);		
		}		
	},


	// call only when there are no layers in the map
	collapseAndHide: function(){
		this.setTitle(OpenLayers.i18n('noActiveLayersSelected'));
		this.collapse(true);
		this.detailsPanelItems.hideDetailsPanelContents();
	}
});