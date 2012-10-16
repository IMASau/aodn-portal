Ext.namespace('Portal.ui');

Portal.ui.ActiveLayersTreeNodeUI = Ext.extend(GeoExt.tree.LayerNodeUI, {
   
    constructor: function(config) {
        
        Portal.ui.ActiveLayersTreeNodeUI.superclass.constructor.call(this, config);
    },
    
    render: function(bulkRender) {

        Portal.ui.ActiveLayersTreeNodeUI.superclass.render.apply(this, arguments);

        this.addButtons();
    },
    
    addButtons: function() {
    
        var cb = this.checkbox;
        var node = this;
        
        Ext.each([
                {
                    tooltip: 'Remove layer',
                    cls: 'remove-layer-button',
                    clickHandler: this.removeLayer
                },
                {
                    tooltip: 'Zoom to layer',
                    cls: 'zoom-to-layer-button',
                    clickHandler: this.zoomToLayer
                }
            ], 
            function(item) {
                var button = Ext.DomHelper.insertBefore(cb, "<input type='button' class='" + item.cls + "' title='" + item.tooltip + "'/>");
                $(button).click(function() {
                    item.clickHandler.call(node);
                })
            }
        );
    },

    removeLayer: function() {
        this.deferToDelegate("removeLayer");
    },
    
    zoomToLayer: function() {
        this.deferToDelegate("zoomToLayer");
    },
    
    deferToDelegate: function(delegateFnName) {
        
        // TODO: how else to either a) fire Ext event (this is not an Ext component)
        // or b) call removeLayer indirectly?
        var activeLayersTreePanel = Ext.getCmp('activeLayerTreePanel');
        
        Ext.TaskMgr.start({
            run : function() {
                activeLayersTreePanel[delegateFnName]();
            },
            interval : 0,
            repeat : 1
        });
    }
});