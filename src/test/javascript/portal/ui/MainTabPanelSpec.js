describe("Portal.ui.MainTabPanel", function() 
{
  var mockConfig = {};
  var mockSearchTabPanel = {};
  var mockPortalPanel = {};
  var mockHomePanel = {};
  
  var buildMockMainTabPanel = function() {
    spyOn(Portal.ui, "PortalPanel").andReturn(mockPortalPanel);
    spyOn(Portal.ui, "HomePanel").andReturn(mockHomePanel);
    spyOn(Portal.search, "SearchTabPanel").andReturn(mockSearchTabPanel);
    spyOn(Portal.ui.MainTabPanel.superclass.constructor, "call");
    spyOn(Portal.ui.MainTabPanel.prototype, "mon");
    
    return new Portal.ui.MainTabPanel({appConfig: mockConfig});
  };
  
  it("creates map, search and portal panels and monitors search panel layeradd events on instantiation", function() {
    var mainTabPanel = buildMockMainTabPanel();
    
    expect(Portal.ui.PortalPanel).toHaveBeenCalled();
    expect(Portal.ui.HomePanel).toHaveBeenCalled();
    expect(Portal.search.SearchTabPanel).toHaveBeenCalled();
    expect(Portal.ui.MainTabPanel.superclass.constructor.call).toHaveBeenCalled();
    expect(mainTabPanel.portalPanel).toEqual(mockPortalPanel);
    expect(mainTabPanel.homePanel).toEqual(mockHomePanel);
    expect(mainTabPanel.searchTabPanel).toEqual(mockSearchTabPanel);
    expect(Portal.ui.MainTabPanel.prototype.mon).toHaveBeenCalled();
  });
  
  it("displays alert when displayLayerAddedMessage is called", function()
  {
    var mainTabPanel = buildMockMainTabPanel();
    
    spyOn(Ext.Msg, 'alert');
    mainTabPanel.displayLayerAddedMessage("SST Tas");
    expect(Ext.Msg.alert).toHaveBeenCalledWith('Add layer', '\'SST Tas\' has been added to the map');
  });
});
