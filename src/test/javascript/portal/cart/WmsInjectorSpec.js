/*
 * Copyright 2013 IMOS
 *
 * The AODN/IMOS Portal is distributed under the terms of the GNU General Public License
 *
 */

describe('Portal.cart.WmsInjector', function() {

    var injector;
    var geoNetworkRecord;

    beforeEach(function() {

        injector = new Portal.cart.WmsInjector();

        geoNetworkRecord = {
            uuid: 9,
            grailsLayerId: 42,
            getWfsLayerFeatureRequestUrl: function() {},
            wmsLayer: {
                getDownloadFilter: function() {
                    return "cql_filter"
                },
                isNcwms: function() {return false},
                getWmsLayerFeatureRequestUrl: function() {},
                wfsLayer: true,
                server: {}
            },
            pointOfTruthLink: 'Link!',
            downloadableLinks: 'Downloadable link!'
        }
    });

    describe('constructor', function() {

        it('assigns values from passed in config', function() {
            var callback = noOp;
            var _tpl = new Portal.cart.WmsInjector({ downloadConfirmation: callback, downloadConfirmationScope: this });
            expect(_tpl.downloadConfirmation).toBe(callback);
            expect(_tpl.downloadConfirmationScope).toBe(this);
        });
    });

    describe('getDataFilterEntry returns wms specific filter information', function() {

        it('returns text if there is a cql filter applied', function() {
            var mockCql = 'CQL(intersects(0,0,0,0))';
            injector._cql = function() {
                return mockCql;
            };

            var filterString = injector._getDataFilterEntry(geoNetworkRecord);
            expect(filterString).not.toEqual('<i>' + OpenLayers.i18n('noFilterLabel') + '</i> <code></code>');
            expect(filterString.indexOf(OpenLayers.i18n('filterLabel'))).toBeGreaterThan(-1);
            expect(filterString.indexOf(mockCql)).toBeGreaterThan(-1);
        });

        it('returns an a no filter message if there is no cql filter applied', function() {
            injector._cql = function() {
                return ''
            };
            expect(injector._getDataFilterEntry(geoNetworkRecord)).toEqual('<i>' + OpenLayers.i18n('noFilterLabel') + '</i> <code></code>');
        });
    });

    describe('createMenuItems', function() {

        it('creates menu items if WFS layer is linked', function() {
            var menuItems = injector._createMenuItems({
                wmsLayer: {
                    getWfsLayerFeatureRequestUrl: noOp,
                    getWmsLayerFeatureRequestUrl: noOp,
                    wfsLayer: {},
                    isNcwms: function() {
                        return false;
                    },
                    server: {}
                }
            });

            expect(menuItems.length).toEqual(1);
        });

        it('includes items for download url list and NetCDF download if urlDownloadFieldName exists', function() {
            var menuItems = injector._createMenuItems({
                wmsLayer: {
                    getWfsLayerFeatureRequestUrl: noOp,
                    getWmsLayerFeatureRequestUrl: noOp,
                    urlDownloadFieldName: true,
                    wfsLayer: null,
                    isNcwms: function() {
                        return false;
                    },
                    server: {}
                }
            });

            var urlListIncluded = false;
            var netCdfDownloadIncluded = false;
            for (var i = 0; i < menuItems.length; i++) {
                if (menuItems[i].text == OpenLayers.i18n('downloadAsUrlsLabel')) {
                    urlListIncluded = true;
                }
                else if (menuItems[i].text == OpenLayers.i18n('downloadAsAllSourceNetCdfLabel')) {
                    netCdfDownloadIncluded = true;
                }
            }

            expect(menuItems.length).toEqual(2); // URL List and NetCDF download
            expect(urlListIncluded).toBe(true);
            expect(netCdfDownloadIncluded).toBe(true);
        });

        it('includes all menu items when wfsLayer and urlDownloadFieldName exist', function() {
            var menuItems = injector._createMenuItems({
                wmsLayer: {
                    getWfsLayerFeatureRequestUrl: noOp,
                    getWmsLayerFeatureRequestUrl: noOp,
                    urlDownloadFieldName: true,
                    wfsLayer: {},
                    isNcwms: function() {
                        return false;
                    },
                    server: {}
                }
            });

            expect(menuItems.length).toEqual(3);
        });
    });

    describe('getDataMarkup', function() {

        var markup;

        beforeEach(function() {
            markup = injector._getDataMarkup(geoNetworkRecord);
        });

        it('provides markup', function() {
            expect(markup).not.toEqual('');
        });

        it('contains the download estimator spinner and loading message', function() {
            expect(markup.indexOf(OpenLayers.i18n("estimatedDlLoadingMessage"))).toBeGreaterThan(-1);
            expect(markup.indexOf(OpenLayers.i18n("estimatedDlLoadingSpinner"))).toBeGreaterThan(-1);
        });
    });

    describe('download handlers', function() {

        var downloadParams;
        var collection;

        beforeEach(function() {
            downloadParams = {};
            spyOn(injector, 'downloadWithConfirmation');
            spyOn(injector, '_getUrlListDownloadParams').andReturn(downloadParams);
            spyOn(injector, '_getNetCdfDownloadParams').andReturn(downloadParams);
            spyOn(injector, '_wfsDownloadUrl');
            spyOn(injector, '_getCsvFormat');

            collection = {
                wmsLayer: {
                    grailsLayerId: 1,
                    isNcwms: function() { return true },
                    server: {}
                }
            };
        });

        describe('_wfsDownloadHandler', function() {
            it('calls downloadWithConfirmation', function() {
                injector._wfsDownloadHandler(collection);
                expect(injector.downloadWithConfirmation).toHaveBeenCalled();
            });

            it('calls _getCsvFormat', function() {
                injector._wfsDownloadHandler(collection);
                expect(injector._getCsvFormat).toHaveBeenCalledWith(collection);
            });
        });

        it('_urlListDownloadHandler calls downloadWithConfirmation', function() {
            injector._urlListDownloadHandler(collection);

            expect(injector.downloadWithConfirmation).toHaveBeenCalledWith(
                collection,
                injector._downloadUrl,
                downloadParams
            );
        });

        it('_netCdfDownloadHandler calls downloadWithConfirmation', function() {
            injector._netCdfDownloadHandler(collection);

            expect(injector.downloadWithConfirmation).toHaveBeenCalledWith(
                collection,
                injector._downloadUrl,
                downloadParams
            );
        });
    });

    describe('_wfsDownloadUrl', function() {

        it('calls correct function on layer', function() {

            var spy = jasmine.createSpy();
            var testLayer = {getWfsLayerFeatureRequestUrl: spy, params: "blagh"};

            injector._wfsDownloadUrl({ wmsLayer: testLayer }, { format: 'csv' });

            expect(testLayer.getWfsLayerFeatureRequestUrl).toHaveBeenCalledWith('csv');
        });
    });

    describe('_wmsDownloadUrl', function() {

        it('calls correct function on layer', function() {

            var spy = jasmine.createSpy();
            var testLayer = {getWmsLayerFeatureRequestUrl: spy, params: "blagh"};

            injector._wmsDownloadUrl({ wmsLayer: testLayer }, { format: 'xml' });

            expect(testLayer.getWmsLayerFeatureRequestUrl).toHaveBeenCalledWith('xml');
        });
    });

    describe('getPointOfTruthLinks', function() {

        it('returns point of truth links as appropriate', function() {
            expect(injector._getPointOfTruthLink(geoNetworkRecord)).toEqual('Link!');
        });
    });

    describe('getMetadataLinks', function() {

        it('returns metadata links as appropriate', function() {
            expect(injector._getMetadataLinks(geoNetworkRecord)).toEqual('Downloadable link!');
        });
    });

    describe('_getCsvFormat', function() {
        it("returns 'csv-with-metadata-header' if server does support CSV metadata header", function() {
            geoNetworkRecord.wmsLayer.server.supportsCsvMetadataHeaderOutputFormat = true;
            expect(injector._getCsvFormat(geoNetworkRecord)).toBe('csv-with-metadata-header');
        });

        it("returns 'csv' if server does not support CSV metadata header", function() {
            geoNetworkRecord.wmsLayer.server.supportsCsvMetadataHeaderOutputFormat = false;
            expect(injector._getCsvFormat(geoNetworkRecord)).toBe('csv');
        });
    });
});
