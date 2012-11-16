Ext.namespace('Portal.ui');

Portal.ui.openlayers.MapOptions = Ext.extend(Object, {

    constructor: function(cfg, mapPanel) {
        var config = Ext.apply({}, cfg);
        Portal.ui.openlayers.MapOptions.superclass.constructor.call(this, config);

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
        
        // Control to get feature info or pop up
        this.clickControl = new Portal.ui.openlayers.ClickControl({
            fallThrough: true,
            onClick: function(event) {
                
                console.log("clickControl click");
                mapPanel._handleFeatureInfoClick(event);              
                mapPanel.closeDropdowns(event); 
            }
        });     

        this.controls = [
            new OpenLayers.Control.Attribution(),
            new OpenLayers.Control.PanZoomBar(),
            new OpenLayers.Control.MousePosition(),
            new OpenLayers.Control.ScaleLine(),
            new OpenLayers.Control.OverviewMap({
                autoPan: true,
                minRectSize: 30,
                mapOptions:{
                    resolutions: [0.3515625, 0.17578125, 0.087890625, 0.0439453125, 0.02197265625, 0.010986328125, 0.0054931640625, 0.00274658203125, 0.001373291015625, 0.0006866455078125, 0.00034332275390625,  0.000171661376953125]
                }
            }),
            toolPanel,
            this.clickControl
        ];
        
        this.theme = null;
        this.displayProjection = new OpenLayers.Projection("EPSG:4326");
        this.prettyStateKeys = true; // for pretty permalinks,
        this.resolutions = [  0.17578125, 0.087890625, 0.0439453125, 0.02197265625, 0.010986328125, 0.0054931640625, 0.00274658203125, 0.001373291015625, 0.0006866455078125, 0.00034332275390625,  0.000171661376953125];
    },
    
    afterRender: function(mapPanel) {
        
        this.mapActionsControl = new Portal.ui.openlayers.MapActionsControl(mapPanel.appConfig);
        mapPanel.map.addControl(this.mapActionsControl);
        this.mapActionsControl.maximizeControl();
        
        this.clickControl.activate();
    },
});
