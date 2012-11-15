describe("Portal.ui.ActiveLayersPanel", function() {
    
    var activeLayersPanel = {};
    activeLayersPanel.activeLayersTreePanelSelectionChangeHandler = Portal.ui.ActiveLayersPanel.prototype.activeLayersTreePanelSelectionChangeHandler;
    activeLayersPanel.fireEvent = function(event) {}

    Ext.getCmp = function() {
        return { update: function() {}, updateAnimationPanel: function() {}}
    };
    
    
    it("selection change triggers selectedLayerChanged event", function() {
        
        var selectedLayerChangedFired = false;
        
        Ext.MsgBus.subscribe("selectedLayerChanged", function() {
            selectedLayerChangedFired = true;
        });
        
        activeLayersPanel.activeLayersTreePanelSelectionChangeHandler({}, { layer: {}});
        expect(selectedLayerChangedFired).toBe(true);
    });
});