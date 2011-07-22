//Ramadda base URL

var ramaddaUrl = 'http://ramadda.aodn.org.au/repository/';
var ramaddaHost = 'http://ramadda.aodn.org.au';
var ramaddaPath='/respository/';
var rootId='21b7aa26-9a0b-492a-9aca-e2ea55dc10d0';
var ramaddaTree;
var ramaddaInfoWindow =null;
var testingRamadda;

function addRamadda() {

    var ramaddaLoader = new Ext.tree.TreeLoader({
          dataUrl: proxyURL+encodeURIComponent(ramaddaUrl+'?entryid='+rootId+'&output=json')
          ,createNode: function(attr) {
            
             attr.text=attr.name;
             attr.leaf=!attr.isGroup;
             if(attr.id!=rootId){
                attr.icon=ramaddaHost+attr.icon;
             }
             return(attr.leaf ?
                        new Ext.tree.TreeNode(attr) :
                        new Ext.tree.AsyncTreeNode(attr));// Ext.tree.TreeLoader.superclass.createNode.call(this, attr);
           }
           ,listeners:{
                beforeload:function(treeLoader, node) {
                    this.dataUrl = proxyURL+encodeURIComponent(ramaddaUrl+'?entryid='+node.id+'&output=json')
                }
           }
    });

    ramaddaTree = new Ext.tree.TreePanel({
         id:'rammadaTree'
         ,autoHeight: true
          ,border: false
          ,rootVisible: true
        ,root:{
             nodeType:'async'
            ,id:rootId
            ,expanded:false
            ,name:'AODN Data Repository'
            ,isGroup:'true'
        }
        ,loader: ramaddaLoader
    });

    Ext.getCmp('contributorTree').add(ramaddaTree);

    ramaddaTree.on("contextmenu",function(node,event){
                    ramaddaTree.getSelectionModel().select(node);
                    treeMenu = createEntryMenu(node);
                    if(treeMenu!=null)
                        treeMenu.show(node.ui.getAnchor());
    });      

}

function createEntryMenu(node){
   var treeMenu = undefined;
    treeMenu = new Ext.menu.Menu();

    // Show information about the entry
    treeMenu.add({
        text:'information'
        ,node:node
        ,listeners:{
                   click: function(item){
                       showInfoRamaddaEntry(item);
                   }
               }
        
    })

    if(node.attributes.type=="wmsserver"){
        treeMenu.add({
            text:'browse WMS server'
            ,node:node
             ,listeners:{
                   click: function(item){
                       addWMStoTree(item);
                   }
               }
        });
    }
    if(node.attributes.links!=undefined){
        for(i=0;i< node.attributes.links.length;i++){
                link=node.attributes.links[i];
                treeMenu.add(
                    {
                       text:link.label
                       ,icon: ramaddaHost+link.icon
                       ,url: ramaddaHost+link.url
                       ,label: link.label
                       ,listeners:{
                           click: function(item){
                               ramaddaHandler(item.url,item.label);
                           }
                       }
                    }
                );
        }
        
        return treeMenu;
    }return null;
}


function showInfoRamaddaEntry(item){
    node=item.node;
    if(ramaddaInfoWindow!=null){
        ramaddaInfoWindow.close();
    }

    html='<h1><img src='+node.attributes.icon+'>'+node.attributes.name+'<h1>';
    html+='<p>'+node.attributes.description+'<p>';
    
    if(node.attributes.metadata.length>0){
        html+='<ul>';
        for(var i=0; i<node.attributes.metadata.length;i++){
            metadata=node.attributes.metadata[i];
            html+='<li>'+metadata.type+' - '+metadata.attr1+' - '+metadata.attr2+' - '+metadata.attr3+'</li>';
        }
        html+='</ul>';
    }


    ramaddaInfoWindow = new Ext.Window({
            id:'ramaddaInfoWindow',
            width:400,
            height:400,
            maximizable: true,
            collapsible: true,
            autoScroll: true,
            title:node.label,
            html:html
    });
    
    ramaddaInfoWindow.show();
}


function ramaddaHandler(url,label){
    

    if(ramaddaInfoWindow!=null){
        ramaddaInfoWindow.close();
    }

    ramaddaInfoWindow = new Ext.Window({
            id:'ramaddaInfoWindow',
            width:400,
            height:400,
            maximizable: true,
            collapsible: true,
            autoScroll: true,
            title:label
    });

    ramaddaInfoWindow.add({
        xtype : "component",
        autoEl : {
            tag : "iframe",
            src : url+'&templateurl=contentaodnStyle',
            align: 'left',
            scrolling: 'auto',
            marginheight: '0',
            marginwidth: '0',
            frameborder: '2'

        }
    })
    ramaddaInfoWindow.on('resize', function(ramaddaInfoWindow,w,h){
      Ext.get(ramaddaInfoWindow.id).query('iframe')[0].style.height = h;
      Ext.get(ramaddaInfoWindow.id).query('iframe')[0].style.width = w;
    });
    ramaddaInfoWindow.on('show', function(ramaddaInfoWindow){
      Ext.get(ramaddaInfoWindow.id).query('iframe')[0].style.height = this.height;
      Ext.get(ramaddaInfoWindow.id).query('iframe')[0].style.width = this.width;
    });
    ramaddaInfoWindow.show();
}

function addWMStoTree(item){
            testingRamadda=item;
            attributes=item.node.attributes;
            Ext.getCmp('contributorTree').add(
                new Ext.tree.TreePanel({
                    root: new Ext.tree.AsyncTreeNode({
                            text: attributes.name,
                            loader: new GeoExt.tree.WMSCapabilitiesLoader({
                                    url: proxyURL+encodeURIComponent(attributes.filename+"SERVICE=WMS&version="+attributes.extraColumns[1]['1']+"&request=GetCapabilities"),
                                    layerOptions: {buffer: 0,  ratio: 1},
                                    layerParams: {'TRANSPARENT': 'TRUE', 'VERSION' : attributes.extraColumns[1]['1'],
                                                   'serverType':attributes.extraColumns[0]['0']},

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
                                    if (node.attributes.layer.serverType=='NCWMS'){
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
      // Ext.getCmp('contributorTree').doLayout();
}




