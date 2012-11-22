
/*
 * Copyright 2012 IMOS
 *
 * The AODN/IMOS Portal is distributed under the terms of the GNU General Public License
 *
 */

function getParameterByNameFromUrlString(urlString, name)
{
	name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
	var regexS = "[\\?&]" + name + "=([^&#]*)";
	var regex = new RegExp(regexS);
	var results = regex.exec(urlString);
	if(results == null) {
		return "";
	}
	else {
		return decodeURIComponent(results[1].replace(/\+/g, " "));
	}
}

function buildParams(type) {
	
	if (!type) {
		return { layer: { params: {}, url: "http://someserver/wms"}};
	}
	
	return { layer: { params: {}, url: "http://someserver/wms", server: { type: type}}};
}

describe("Portal.details.StylePanel", function() {
	
	var stylePanel = new Portal.details.StylePanel({});

	it("no append when no type specified", function() {
		
		var urlString = stylePanel.buildGetLegend(buildParams());
		expect(getParameterByNameFromUrlString(urlString, "VERSION")).toEqual("");
	});
	
	it("WMS-1.1.0", function() {
		var urlString = stylePanel.buildGetLegend(buildParams("WMS-1.1.0"));
		expect(getParameterByNameFromUrlString(urlString, "VERSION")).toEqual("1.1.0");
	});
	
	it("WMS-1.1.1", function() {
		var urlString = stylePanel.buildGetLegend(buildParams("WMS-1.1.1"));
		expect(getParameterByNameFromUrlString(urlString, "VERSION")).toEqual("1.1.1");
	});
	
	it("NCWMS-1.1.1", function() {
		var urlString = stylePanel.buildGetLegend(buildParams("NCWMS-1.1.1"));
		expect(getParameterByNameFromUrlString(urlString, "VERSION")).toEqual("1.1.1");
	});
});
