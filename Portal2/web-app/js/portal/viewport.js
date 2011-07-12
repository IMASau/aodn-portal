var layer;
var map;
var MAX_WIDTH = 1024;
var MAX_HEIGHT = 1024;
var activeLayers;
var contributorTree;
var testing;

//--------------------------------------------------------------------------------------------
//Some JSON stuff
var ready = false;
var my_JSON_object = {};
var detailsPanel;
var layersTree;
var currentNode;
var checkNode;
var proxyURL = "proxy?url=";

//--------------------------------------------------------------------------------------------
//GeoExt stuff
Ext.onReady(function() {

//making the map
        map = new OpenLayers.Map();
        map.restrictedExtent = new OpenLayers.Bounds.fromString("-10000,-90,10000,90");
        map.resolutions = [  0.17578125, 0.087890625, 0.0439453125, 0.02197265625, 0.010986328125, 0.0054931640625, 0.00274658203125, 0.001373291015625, 0.0006866455078125, 0.00034332275390625,  0.000171661376953125];

        OpenLayers.DOTS_PER_INCH = 25.4 / 0.28;

        layer = new OpenLayers.Layer.WMS(
            "IMOS Base Layer",
            "http://imos2.ersa.edu.au/cgi-bin/tilecache.cgi",
            {layers: "HiRes_aus-group"},
            {wrapDateLine: true},
            {isBaseLayer: true}
        );
        map.addLayer(layer);
        map.setCenter(new OpenLayers.LonLat(141, -32), 1);

		var ctrl, toolbarItems = [], action, actions = {};

    // ZoomToMaxExtent control, a "button" control
    action = new GeoExt.Action({
        control: new OpenLayers.Control.ZoomToMaxExtent(),
        map: map,
        text: "max extent",
        tooltip: "zoom to max extent"
    });
    actions["max_extent"] = action;
    toolbarItems.push(action);
    toolbarItems.push("-");



    // Navigation history - two "button" controls
    ctrl = new OpenLayers.Control.NavigationHistory();
    map.addControl(ctrl);

    action = new GeoExt.Action({
        text: "previous",
        control: ctrl.previous,
        disabled: true,
        tooltip: "previous in history"
    });
    actions["previous"] = action;
    toolbarItems.push(action);

    action = new GeoExt.Action({
        text: "next",
        control: ctrl.next,
        disabled: true,
        tooltip: "next in history"
    });
    actions["next"] = action;
    toolbarItems.push(action);
    toolbarItems.push("->");

    // Reuse the GeoExt.Action objects created above
    // as menu items
    toolbarItems.push({
        text: "menu",
        menu: new Ext.menu.Menu({
            items: [
                // ZoomToMaxExtent
                actions["max_extent"],
                // Nav
                new Ext.menu.CheckItem(actions["nav"]),
                // Select control
                new Ext.menu.CheckItem(actions["select"]),
                // Navigation history control
                actions["previous"],
                actions["next"]
            ]
        })
    });


  //creating the map panel in the center
    var mapPanel = new GeoExt.MapPanel({
            height: 800,
            width: 800,
            border: true,
            map: map,
            region: "center",
            split: true,
			tbar: toolbarItems,
            zoom: 1,
            title: 'A Simple GeoExt Map',
            items: [{
                xtype: "gx_zoomslider",
                aggressive: false,
                vertical: true,
                height: 100,
                x: 15,
                y: 140,
                plugins: new GeoExt.ZoomSliderTip()
            }]
           });

	 var control = new OpenLayers.Control.Click({
        trigger: function(evt) {
            var loc = mapPanel.map.getLonLatFromViewPortPx(evt.xy);
            addToPopup(loc,mapPanel,evt);
        }
    });

    mapPanel.map.addControl(control);
    control.activate();


    var layerStore = new GeoExt.data.LayerStore();

    var layersContainer = new GeoExt.tree.LayerContainer({
        nodeType: 'gx_layercontainer',
        text: 'AODN Map Layers',
        leaf: false,
        expanded: false,
		enableDD: true,
        layerStore: layerStore,
        listeners: {
            expand: function(node, event){
                if(node.done == undefined)
                {
                    Ext.Ajax.request({
                               url: 'layersJSON2.txt',
                               success: function(resp){
                                     //alert(resp.responseText);
                                     my_JSON_object= Ext.util.JSON.decode(resp.responseText);
                               }
                    });
                    var jsonData=my_JSON_object;
                    if(jsonData.length > 0)
                    {
                        for(var i = 0; i < jsonData.length; i++)
                        {
                            for(var j = 0; j < jsonData[i]["children"].length; j++)
                            {
                                var child = jsonData[i]["children"][j];
                                var childLayer = new OpenLayers.Layer.WMS(
                                child["text"],
                                child["attr"]["server"],
                                {layers: child["attr"]["layer"], transparent: true},
                                {wrapDateLine: true, isBaseLayer: false, visibility: false}
                                );

                                var layerNode = new GeoExt.tree.LayerNode({
                                    checked: false,
                                    layer: childLayer,
                                    listeners: {
                                        click: function(node, event){
                                            mapPanel.map.addLayer(node.layer);
                                            //alert(map.layers.length);
                                        },
										load: function(node, event){
                                            node.layer;
                                            //alert(map.layers.length);
                                        }

                                    }
                                });

                                var layerFolder = new Ext.tree.TreeNode({
                                    text: "it is a folder"
                                });

                                layerFolder.appendChild(layerNode);
                                //alert(layerFolder.childNodes.length);
                                node.appendChild(layerFolder);

                            }
                        }
                    }
                    node.done = true;
                }
            }
        }
    });

    //creating the menu tree on the left
    contributorTree = new Ext.tree.TreePanel({
        layout: "fit",
        region: "west",
        title: "Contributors",
        width: 170,
        height: 500,
        autoscroll: true,
        collapsible: false,
        collapseMode: "mini",
        split: true,
        root: layersContainer
   });


    
    ncWMS = new Ext.tree.TreePanel({
        root: new Ext.tree.AsyncTreeNode({
                text: 'ncWMS emii',
                loader: new GeoExt.tree.WMSCapabilitiesLoader({
                        url: proxyURL +encodeURIComponent('http://ncwms.emii.org.au/ncWMS/wms?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0&DATASET=satellite_data_sst'),
                        layerOptions: {buffer: 0, singleTile: true, ratio: 1},
                        layerParams: {'TRANSPARENT': 'TRUE','VERSION':'1.3.0'},
                        // customize the createNode method to add a checkbox to nodes
                        createNode: function(attr) {
                                attr.checked = attr.leaf ? false : undefined;
                                return GeoExt.tree.WMSCapabilitiesLoader.prototype.createNode.apply(this, [attr]);
                        }
                })
        })
		,
        width: 250,
        autoHeight: true,
        border: false,
		//rootVisible: false,
        listeners: {
            // Add layers to the map when ckecked, remove when unchecked.
            // Note that this does not take care of maintaining the layer
            // order on the map.
            'checkchange': function(node, checked) {
                if (checked === true) {
                    node.attributes.layer.yx = true;
                    node.attributes.layer.isncWMS =true;
                    mapPanel.map.addLayer(node.attributes.layer);
                } else {
                    mapPanel.map.removeLayer(node.attributes.layer);
                }
            }
        }
    });

   geoserver = new Ext.tree.TreePanel({
        root: new Ext.tree.AsyncTreeNode({
        text: 'geoserver',
        loader: new GeoExt.tree.WMSCapabilitiesLoader({
                url: proxyURL + encodeURIComponent('http://geoserver.emii.org.au/geoserver/ows?service=wms&version=1.3.0&request=GetCapabilities'),
                layerOptions: {buffer: 0, singleTile: true, ratio: 1},
                layerParams: {'TRANSPARENT': 'TRUE'},
                // customize the createNode method to add a checkbox to nodes
                createNode: function(attr) {
                        attr.checked = attr.leaf ? false : undefined;
                        return GeoExt.tree.WMSCapabilitiesLoader.prototype.createNode.apply(this, [attr]);
                }
        })
})
		,
        width: 250,
		autoHeight: true,
        border: false,
		//rootVisible: false,
        listeners: {
            // Add layers to the map when ckecked, remove when unchecked.
            // Note that this does not take care of maintaining the layer
            // order on the map.
            'checkchange': function(node, checked) {
                if (checked === true) {
                    mapPanel.map.addLayer(node.attributes.layer);
                } else {
                    mapPanel.map.removeLayer(node.attributes.layer);
                }
            }
        }
    });

	   cmar = new Ext.tree.TreePanel({

        root: new Ext.tree.AsyncTreeNode({
                text: 'cmar',
                loader: new GeoExt.tree.WMSCapabilitiesLoader({
                        url: proxyURL +encodeURIComponent('http://www.cmar.csiro.au/geoserver/ows?service=wms&version=1.1.1&request=GetCapabilities'),
                        layerOptions: {buffer: 0, singleTile: true, ratio: 1},
                        layerParams: {'TRANSPARENT': 'TRUE'},
                        // customize the createNode method to add a checkbox to nodes
                        createNode: function(attr) {
                                attr.checked = attr.leaf ? false : undefined;
                                return GeoExt.tree.WMSCapabilitiesLoader.prototype.createNode.apply(this, [attr]);
                        }
                })
        })
		,
        width: 250,
		autoHeight: true,
        border: false,
        margins: '0 0 5 0',
		//rootVisible: false,
        listeners: {
            // Add layers to the map when ckecked, remove when unchecked.
            // Note that this does not take care of maintaining the layer
            // order on the map.
            'checkchange': function(node, checked) {
                if (checked === true) {
                    mapPanel.map.addLayer(node.attributes.layer);
                } else {
                    mapPanel.map.removeLayer(node.attributes.layer);
                }
            }
        }
    });

	AAD = new Ext.tree.TreePanel({
        root: new Ext.tree.AsyncTreeNode({
                text: 'AAD',
                loader: new GeoExt.tree.WMSCapabilitiesLoader({
                        url: proxyURL +encodeURIComponent('http://services.aad.gov.au/geoserver/ows?service=wms&version=1.3.0&request=GetCapabilities'),
                        layerOptions: {buffer: 0, singleTile: true, ratio: 1},
                        layerParams: {'TRANSPARENT': 'TRUE'},
                        // customize the createNode method to add a checkbox to nodes
                        createNode: function(attr) {
                                attr.checked = attr.leaf ? false : undefined;
                                return GeoExt.tree.WMSCapabilitiesLoader.prototype.createNode.apply(this, [attr]);
                        }
                })
        })
		,
        width: 250,
        autoHeight: true,
        border: false,


		//rootVisible: false,
        listeners: {
            // Add layers to the map when ckecked, remove when unchecked.
            // Note that this does not take care of maintaining the layer
            // order on the map.
            'checkchange': function(node, checked) {
                if (checked === true) {
                    mapPanel.map.addLayer(node.attributes.layer);
                } else {
                    mapPanel.map.removeLayer(node.attributes.layer);
                }
            }
        }
    });






    var leftTabPanel = new Ext.TabPanel({
        title: 'Layers Tab Panel',
        region: 'center',
        autoscroll: true,
        split: true,
        width: 250,
		autoScroll: true,
        activeTab: 1,
        items: [
            contributorTree ,
			{ 	region: 'west',
				title: "WMS Browser",
				id : 'contributorTree',
				autoscroll: true,
				items : [  ncWMS,geoserver,AAD,cmar]
			}
        ]
    });


	Ext.Ajax.request({
            url: 'server/list?type=JSON',
            success: function(resp){
                     //alert(resp.responseText);
                    var serverList= Ext.util.JSON.decode(resp.responseText);
                    for(var i = 0; i<serverList.length;i++){

                        Ext.getCmp('contributorTree').add(
                            new Ext.tree.TreePanel({
                                root: new Ext.tree.AsyncTreeNode({
                                        text: serverList[i].name,
                                        loader: new GeoExt.tree.WMSCapabilitiesLoader({
                                                url: proxyURL+encodeURIComponent(serverList[i].uri+"?service=WMS&version="+serverList[i].wmsVersion+"&request=GetCapabilities"),
                                                layerOptions: {buffer: 0, singleTile: true, ratio: 1},
                                                layerParams: {'TRANSPARENT': 'TRUE', 'VERSION' : serverList[i].wmsVersion, 'serverType':serverList[i].type},

                                                // customize the createNode method to add a checkbox to nodes
                                                createNode: function(attr) {

                                                        attr.checked = attr.leaf ? false : undefined;

                                                        return GeoExt.tree.WMSCapabilitiesLoader.prototype.createNode.apply(this, [attr]);
                                                }
                                        })
                                })
                                ,
                                width: 250,
                                autoHeight: true,
                                border: false,

                                rootVisible: true,
                                listeners: {
                                    // Add layers to the map when ckecked, remove when unchecked.
                                    // Note that this does not take care of maintaining the layer
                                    // order on the map.
                                    'checkchange': function(node, checked) {
                                        if (checked === true) {
                                                testing=node;
                                                if (node.attributes.layer.serverType='NCWMS'){
                                                        node.attributes.layer.yx = true;
                                                        node.attributes.layer.isncWMS =true;
                                                }
                                                mapPanel.map.addLayer(node.attributes.layer);
                                        } else {
                                                mapPanel.map.removeLayer(node.attributes.layer);
                                    }
                                }
                            }
                        })
                    );
                }
            }
	});






   detailsPanel = new Ext.Panel({
        title: 'Layer Details',
        region: 'south',
        html: '<div id="slider" style="clear:both"></div>',
        //items: [opacitySlider],
        border: false,
        split: true,
        autoScroll: true,
        collapsible: true
    });

    var layerList = new GeoExt.tree.OverlayLayerContainer({
        text: 'All Layers',
        layerStore: mapPanel.layers,
        leaf: false,
        expanded: true,
		listeners: {
				// Add layers to the map when ckecked, remove when unchecked.
				// Note that this does not take care of maintaining the layer
				// order on the map.
				append: function(node, event){
					//if(node.layer.isBaseLayer==false){
						//alert('load');
					//}
				}
		}
    });

   var activePanel = new Ext.tree.TreePanel({
        autoScroll: true,
        split: true,
        region: 'north',
        root: layerList,
	enableDD: true,
        width: 170,
        height: 300,
        floating: true,
        rootVisible: false,
        x: 380,
        y: 0

    });
//
// create a separate slider bound to the map but displayed elsewhere
    var opacitySlider = new GeoExt.LayerOpacitySlider({
        layer: layer,
        aggressive: true,
        width: 200,
        isFormField: true,
        inverse: false,
        fieldLabel: "opacity",
        plugins: new GeoExt.LayerOpacitySliderTip({template: '<div>Opacity: {opacity}%</div>'})
    });


var viewport = new Ext.Viewport({
    layout: 'border',
    items: [
    {
        title: "Active layers",
        layout: 'border',
        items: [
            activePanel,leftTabPanel
        ],
        region: 'west',
        autoscroll: true,
        collapsible: true,
        split: true,
        width: 250
    },
    detailsPanel,mapPanel]
});

viewport.show();

});