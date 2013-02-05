
/*
 * Copyright 2012 IMOS
 *
 * The AODN/IMOS Portal is distributed under the terms of the GNU General Public License
 *
 */

describe("Portal.ui.FeatureInfoPopup", function()
{
    var map;
    var featureInfoPopup;
    
    beforeEach(function() {
        map = new OpenLayers.Map();
        featureInfoPopup = new Portal.ui.FeatureInfoPopup({map: map, appConfig: {}});
    });

    afterEach(function() {
        featureInfoPopup.destroy();
    });
    
	// Simple case, two tabs, first one remains selected.
	it("load two tabs, first remains selected", function()
	{
		featureInfoPopup._addPopupTabContent("", "tab 1");
		featureInfoPopup._addPopupTabContent("", "tab 2");
		
		expect(featureInfoPopup.popupTab.getActiveTab().title).toEqual("tab 1");
	});
	
	// Case for #1726.
	// - 2 tabs load
	it("load two tabs, select 2nd, load 3rd - 2nd remains selected", function()
	{
		featureInfoPopup._addPopupTabContent("", "tab 1");
		featureInfoPopup._addPopupTabContent("", "tab 2");
		expect(featureInfoPopup.popupTab.getActiveTab().title).toEqual("tab 1");
		
		// - user clicks/activates 2nd tab
		featureInfoPopup.popupTab.setActiveTab(1);
		expect(featureInfoPopup.popupTab.getActiveTab().title).toEqual("tab 2");

		// - third tab loads
		featureInfoPopup._addPopupTabContent("", "tab 3");
		
		// 2nd tab remains selected.
		expect(featureInfoPopup.popupTab.getActiveTab().title).toEqual("tab 2");
	});
	
   it('on reset', function() {
        
        spyOn(Portal.ui.FeatureInfoPopup.prototype, 'close');
        Ext.MsgBus.publish('reset');
        expect(Portal.ui.FeatureInfoPopup.prototype.close).toHaveBeenCalled();
    });

    it("._clickPoint returns integer x and y values", function()
    {
        featureInfoPopup.map.getViewPortPxFromLonLat = function() {
            var position = {};
            position.x = 30.1;
            position.y = 30.1;
            return position;
        }

        expect(featureInfoPopup._clickPoint().x).toEqual(30);
        expect(featureInfoPopup._clickPoint().y).toEqual(30);
    });
});
