/*
 * Copyright 2013 IMOS
 *
 * The AODN/IMOS Portal is distributed under the terms of the GNU General Public License
 *
 */

describe('Portal.cart.WfsDataRowTemplate', function() {

    var tpl;
    var geoNetworkRecord;

    beforeEach(function() {
        tpl = new Portal.cart.WfsDataRowTemplate();
        geoNetworkRecord = {
            uuid: 9,
            grailsLayerId: 42,
            wmsLayer: {
                getDownloadFilter: function() {
                    return "cql_filter"
                }
            }
        };
        geoNetworkRecord.getWfsLayerFeatureRequestUrl = function() {};
    });

    describe('getDataFilterEntry', function() {
        it('returns text if there is a cql filter applied', function() {
            var mockCql = 'CQL(intersects(0,0,0,0))';
            tpl._cql = function() {
                return mockCql;
            };

            var filterEntry = tpl.getDataFilterEntry({});
            expect(filterEntry).not.toEqual('<i>No filters applied.</i> <code></code>');
            expect(filterEntry.indexOf(OpenLayers.i18n('filterLabel'))).toBeGreaterThan(-1);
            expect(filterEntry.indexOf(mockCql)).toBeGreaterThan(-1);
        });

        it('returns an a no filter message if there is no cql filter applied', function() {
            tpl._cql = function() {
                return ''
            };
            expect(tpl.getDataFilterEntry({})).toEqual('<i>No filters applied.</i> <code></code>');
        });
    });

    describe('createMenuItems', function() {
        it('creates menu items', function() {
            var menuItems = tpl.createMenuItems({
                wmsLayer: {
                    getWfsLayerFeatureRequestUrl: noOp,
                    getWmsLayerFeatureRequestUrl: noOp
                }
            });
            expect(menuItems.length).toEqual(3);
        });

        it('includes an item to download a list of urls', function() {
            var menuItems = tpl.createMenuItems({
                wmsLayer: {
                    getWfsLayerFeatureRequestUrl: noOp,
                    getWmsLayerFeatureRequestUrl: noOp,
                    urlDownloadFieldName: true
                }
            });
            expect(menuItems.length).toEqual(4);

            var included = false;
            for (var i = 0; i < menuItems.length; i++) {
                if (menuItems[i].text == OpenLayers.i18n('downloadAsUrlsLabel')) {
                    included = true;
                    i = menuItems.length;
                }
            }

            expect(included).toBe(true);
        });

        // todo - This test could probably be combined with the one above
        /*it('includes an item to download a netCDF file', function() {
            var menuItems = tpl.createMenuItems({
                wmsLayer: {
                    getWfsLayerFeatureRequestUrl: noOp,
                    urlDownloadFieldName: true
                }
            });
            expect(menuItems.length).toEqual(5);

            var included = false;
            for (var i = 0; i < menuItems.length; i++) {
                if (menuItems[i].text == OpenLayers.i18n('downloadAsNetCdfLabel')) {
                    included = true;
                    i = menuItems.length;
                }
            }

            expect(included).toBe(true);
        });*/
    });

    describe('download handlers', function() {
        it('_downloadWfsHandler calls downloadWithConfirmation', function() {
            spyOn(tpl, 'downloadWithConfirmation');
            spyOn(tpl, '_wfsDownloadUrl');
            tpl._downloadWfsHandler({}, 'csv');
            expect(tpl.downloadWithConfirmation).toHaveBeenCalled();
        });

        it('_urlListDownloadHandler calls downloadWithConfirmation', function() {
            spyOn(tpl, 'downloadWithConfirmation');
            spyOn(tpl, '_wmsDownloadUrl');
            tpl._urlListDownloadHandler({
                wmsLayer: {
                    grailsLayerId: 1
                }
            });
            expect(tpl.downloadWithConfirmation).toHaveBeenCalled();
        });
    });

    describe('download size estimate', function() {
        var mockEstimate;
        it('getDataSpecificMarkup calls _getDownloadEstimate', function() {
            spyOn(tpl, '_getDownloadEstimate');
            tpl.getDataSpecificMarkup({});
            expect(tpl._getDownloadEstimate).toHaveBeenCalled();
        });

        it('_generateEstHtmlString formats correctly when returned value is -1', function() {
            mockEstimate = -1;
            mockHtml = tpl._generateEstHtmlString(mockEstimate);
            expect(mockHtml).toEqual('<div>The estimated download size is unknown.  </div><div class="clear"></div>');
        });

        it('_generateEstHtmlString formats correctly when returned value is -1', function() {
            mockEstimate = NaN;
            mockHtml = tpl._generateEstHtmlString(mockEstimate);
            expect(mockHtml).toEqual('<div>The estimated download size is unknown.  </div><div class="clear"></div>');
        });

        it('_generateEstHtmlString formats correctly when size is greater than 1024', function() {
            mockEstimate = 1100;
            mockHtml = tpl._generateEstHtmlString(mockEstimate);
            expect(mockHtml).toEqual('<div>The estimated download size is  1.1GB <img src="images/clock_red.png"></div><div class="clear"></div>');
        });

        it('_generateEstHtmlString formats correctly when size is greater than 512 and less than 1024', function() {
            mockEstimate = 600;
            mockHtml = tpl._generateEstHtmlString(mockEstimate);
            expect(mockHtml).toEqual('<div>The estimated download size is  600MB <img src="images/clock_red.png"></div><div class="clear"></div>');
        });

        it('_generateEstHtmlString formats correctly when size is less than 512', function() {
            mockEstimate = 400;
            mockHtml = tpl._generateEstHtmlString(mockEstimate);
            expect(mockHtml).toEqual('<div>The estimated download size is  400MB </div><div class="clear"></div>');
        });
    });

    describe('_wfsDownloadUrl', function() {

        it('calls correct function on layer', function() {

            var spy = jasmine.createSpy();
            var testLayer = {getWfsLayerFeatureRequestUrl: spy};

            tpl._wfsDownloadUrl(testLayer, 'csv');

            expect(testLayer.getWfsLayerFeatureRequestUrl).toHaveBeenCalledWith('csv');
        });
    });

    describe('_wmsDownloadUrl', function() {

        it('calls correct function on layer', function() {

            var spy = jasmine.createSpy();
            var testLayer = {getWmsLayerFeatureRequestUrl: spy};

            tpl._wmsDownloadUrl(testLayer, 'xml');

            expect(testLayer.getWmsLayerFeatureRequestUrl).toHaveBeenCalledWith('xml');
        });
    });
});
