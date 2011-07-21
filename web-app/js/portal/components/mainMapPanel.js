var map;
var layer;
var navigationHistoryCtrl;

function initMap()
{


    // Stop the pink tiles appearing on error
    OpenLayers.Util.onImageLoadError = function(e) {
        this.style.display = "";
        this.src="img/blank.gif";
    }


    navigationHistoryCtrl = new OpenLayers.Control.NavigationHistory();

    
    var controls= [];

    controls.push(
        new OpenLayers.Control.Navigation(),
        new OpenLayers.Control.Attribution(),
        new OpenLayers.Control.PanPanel(),
        navigationHistoryCtrl
        //new OpenLayers.Control.ZoomPanel()
    );
    var options = {
         controls: controls,
         displayProjection: new OpenLayers.Projection("EPSG:4326"),
         units: "m",
         prettyStateKeys: true // for pretty permalinks
     };


    //make the map
    map = new OpenLayers.Map(options);
    map.restrictedExtent = new OpenLayers.Bounds.fromString("-10000,-90,10000,90");
    map.resolutions = [  0.17578125, 0.087890625, 0.0439453125, 0.02197265625, 0.010986328125, 0.0054931640625, 0.00274658203125, 0.001373291015625, 0.0006866455078125, 0.00034332275390625,  0.000171661376953125];

    OpenLayers.DOTS_PER_INCH = 25.4 / 0.28;


    layer = new OpenLayers.Layer.WMS(
        "IMOS Base Layer",
        "http://imos2.ersa.edu.au/cgi-bin/tilecache.cgi",
        {layers: "HiRes_aus-group"},
        {wrapDateLine: true,
            transitionEffect: 'resize',
            isBaseLayer: true}
    );

    map.addLayer(layer);


    //creating the map panel in the center
    mapPanel = new GeoExt.MapPanel({
            center: new OpenLayers.LonLat(141, -32),
            zoom: 1,
            id: "map",
            border: false,
            map: map,
            region: "center",
            split: true,
            // tbar: setToolbarItems(),
            header: false,
            //title: 'Map panel',
            items: [{
                xtype: "gx_zoomslider",
                aggressive: false,
                vertical: true,
                height: 100,
                x: 12,
                y: 120,
                plugins: new GeoExt.ZoomSliderTip()
            }
            ]
       });

     // mapPanel.removeListener('click', this.onClick, this);
    var mapToolbar=  new Ext.Toolbar({
              // shadow: false,
               height: 28
               ,width:'100%'
              // ,floating: true
               ,cls:'semiTransparent noborder'//
               ,overCls: "fullTransparency"
               ,unstyled: true               
               ,items: setToolbarItems()
               
            });
//mapToolbar.suspendEvents(true);
   //   mapToolbar.un('click', this.onClick, this);

     // put the toobar in a panel as the toolbar wont float
    var mapLinks=  new Ext.Panel({
               id: "mapLinks"
               ,shadow: false
               ,width:'100%'
               ,closeAction: 'hide'
               ,floating: true
               ,unstyled: true
               ,closeable: true
               //,listeners: NOT WORKING HERE
               ,items: mapToolbar
            });

 var onClick2 = function(ev, target){
    alert(target);
    ev.preventDefault(); // Prevents the browsers default handling of the event
    ev.stopPropagation(); // Cancels bubbling of the event
    ev.stopEvent() // preventDefault + stopPropagation

    var target = ev.getTarget() // Gets the target of the event (same as the argument)
    
    var relTarget = ev.getRelatedTarget(); // Gets the related target
};



    mapPanel.add(mapLinks);
    mapLinks.setPosition(1,0);


    // Controll to get feature info or pop up
    var clickControl = new OpenLayers.Control.Click2({

        trigger: function(evt) {
            var loc = mapPanel.map.getLonLatFromViewPortPx(evt.xy);
            addToPopup(loc,mapPanel,evt);
        }
        
    });

    mapPanel.map.addControl(clickControl);
    clickControl.activate();

}
// lsteners modified here after layout
function modMapListeners() {

    var el = Ext.get('mapLinks');
    // stops the click bubbling to a getFeatureInfo request on the map
    el.on('click', function(ev, target){
        //alert(target);
        ev.preventDefault(); // Prevents the browsers default handling of the event
        ev.stopPropagation(); // Cancels bubbling of the event
        ev.stopEvent() // preventDefault + stopPropagation
        //var target = ev.getTarget(); // Gets the target of the event (same as the argument)
        //var relTarget = ev.getRelatedTarget(); // Gets the related target
    });
}

function setToolbarItems() {

    var action, actions = {};
    var toolbarItems = [];
    

    // Navigation history - two "button" controls
    action = new Ext.Button({
        text:'Home',
        handler: centreMap //map.js
    });

    actions["previous"] = action;
    toolbarItems.push(action);

    action = new GeoExt.Action({
        text: "previous",
        control: navigationHistoryCtrl.previous,
        disabled: true,
        tooltip: "previous in history"
    });
    actions["previous"] = action;
    toolbarItems.push(action);

    action = new GeoExt.Action({
        text: "next",
        control: navigationHistoryCtrl.next,
        disabled: true,
        tooltip: "next in history"
    });
    actions["next"] = action;
    toolbarItems.push(action);
    
    
    toolbarItems.push("->");

    // Reuse the GeoExt.Action objects created above
    // as menu items
    toolbarItems.push({
        text: "History",
        menu: new Ext.menu.Menu({
            items: [
                // Nav
                //new Ext.menu.CheckItem(actions["previous"]),
                // Select control
                //new Ext.menu.CheckItem(actions["select"]),
                // Navigation history control
                actions["previous"],
                actions["next"]
            ]
        })
        
    });



  return toolbarItems;

  


}