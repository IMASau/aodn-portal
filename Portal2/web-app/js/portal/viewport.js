

var MAX_WIDTH = 1024;
var MAX_HEIGHT = 1024;
var activeLayers;
var contributorTree;
var testViewport;

//--------------------------------------------------------------------------------------------
//Some JSON stuff
var ready = false;
var my_JSON_object = {};
var detailsPanel;
var layersTree;
var currentNode;
var checkNode;
var proxyURL = "proxy?url=";
var activePanel, layerList, opacitySlider;
var toolbarItems = []

var toolbarpointer;

//--------------------------------------------------------------------------------------------

 var nodeSelected;
 var mapPanel;
//
Ext.state.Manager.setProvider(new Ext.state.CookieProvider());
//GeoExt stuff
Ext.onReady(function() {

     initMap();

    //creating the map panel in the center
    mapPanel = new GeoExt.MapPanel({
            center: new OpenLayers.LonLat(141, -32),
            zoom: 1,
            border: false,
            map: map,
            region: "center",
            split: true,
	    tbar: toolbarItems,
            header: false,
            //title: 'Map panel',
            items: [{
                xtype: "gx_zoomslider",
                aggressive: false,
                vertical: true,
                height: 100,
                x: 12,
                y: 80
                //plugins: new GeoExt.ZoomSliderTip()
            }]
           });


    // Controll to get feature info or pop up
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
				autoscroll: true
				
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
                                            layerParams: {'TRANSPARENT': 'TRUE', 'VERSION' : serverList[i].wmsVersion,
                                                           'serverType':serverList[i].type},

                                            // customize the createNode method to add a checkbox to nodes
                                            createNode: function(attr) {
                                                    attr.checked = attr.leaf ? false : undefined;
                                                    //attr.active=attr.leaf ? false : undefined;;
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
                                'checkchange': function(node,checked) {
                                    if (checked === true) {
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

// create a separate slider bound to the map but displayed elsewhere
    opacitySlider = new GeoExt.LayerOpacitySlider({
        id: "opacitySlider",
        layer: layer,
        width: 200,
        inverse: false,
        fieldLabel: "opacity",
        plugins: new GeoExt.LayerOpacitySliderTip({template: '<div>Opacity: {opacity}%</div>'})
    });

   detailsPanel = new Ext.Panel({
        title: 'Layer Options',
        region: 'south',
        border: false,
        split: true,
        height: 100,
        autoScroll: true,
        collapsible: true,
        items: [
               opacitySlider
        ]
    });


   function updateDetailsPanel(node)
   {
        detailsPanel.text = node.layer.name;
        detailsPanel.setTitle("Layer Options: " + node.layer.name);
        opacitySlider.setLayer(node.layer);
   }


    layerList = new GeoExt.tree.OverlayLayerContainer({
        text: 'All Layers',
        layerStore: mapPanel.layers,
        leaf: false,
        expanded: true
        
    });



   activePanel = new Ext.tree.TreePanel({
       header: false,
       title: 'Map Layers',
       id: 'activePanelTree',
       split: true,
       region: 'north',
       enableDD: true,
       height: 200,
       rootVisible: false,
       root: layerList,
        listeners: {
            append: function(node,event){
                node.on("click", function(node,event){
                    if(node.isSelected())
                    {
                        updateDetailsPanel(node);
                    }
                });

            }
        }
    });

    //Active layer menu
    layerMenu = new Ext.menu.Menu({
            items: [
                {
                    text: 'Remove layer',
                    handler: removeLayer
                },
                {
                    text: 'Zoom to layer',
                    handler: setExtentLayer
                },
                {
                    text: 'Visible',
                    checked: true,
                    handler: visibleLayer
                }, '-', {
                    text: 'More Options',
                    menu: {
                        items: [{
                            text: 'Geoext is great'
                        }, {
                            text: 'Ext is even better'
                        }, {
                            text: 'Matias add menu items!'
                        }]
                    }
                }
            ]
        });



    function removeLayer() {
        // Remove layer. First unselect to remove from the tree of WMS Browse
        mapPanel.map.removeLayer(activePanel.getSelectionModel().getSelectedNode().layer);
    }
    function visibleLayer() {
        // If visible the undo checkchange
        activePanel.getSelectionModel().getSelectedNode().checked=!activePanel.getSelectionModel().getSelectedNode().checked;
    }
     function setExtentLayer() {
        // Remove layer. First unselect to remove from the tree of WMS Browse
        var extent=activePanel.getSelectionModel().getSelectedNode().layer.metadata.llbbox;
        bounds = new OpenLayers.Bounds();
        bounds.extend(new OpenLayers.LonLat(extent[0],extent[1]));
        bounds.extend(new OpenLayers.LonLat(extent[2],extent[3]));

        mapPanel.map.zoomToExtent(bounds);
    }


    activePanel.on("contextmenu",function(node,event){
                    activePanel.getSelectionModel().select(node);
                    layerMenu.show(node.ui.getAnchor());
    });

   
var viewport = new Ext.Viewport({
    layout: 'border',
    stateful: true,
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
    },{
        region:'center',
        layout:'border',
        items: [
            mapPanel,
            detailsPanel
        ]
    }]
});




viewport.show();

 });

