/*
 * Copyright 2014 IMOS
 *
 * The AODN/IMOS Portal is distributed under the terms of the GNU General Public License
 *
 */
describe("Portal.data.GeoNetworkRecordFetcher", function() {

    var catalogUrl;
    var fetcher;
    var uuid;

    beforeEach(function() {
        catalogUrl = 'http://geonetwork123';

        Ext.namespace('Portal.app.appConfig.geonetwork');
        Portal.app.appConfig.geonetwork.url = catalogUrl;
        fetcher = new Portal.data.GeoNetworkRecordFetcher({
            dataCollectionStore: {
                add: jasmine.createSpy('add)')
            }
        });
        uuid = '1234';
    });

    it('makes ajax request to catalogue', function() {
        spyOn(Ext.Ajax, 'request');

        fetcher.get(uuid);

        expect(Ext.Ajax.request).toHaveBeenCalledWith({
            url: 'proxy?url=http%3A%2F%2Fgeonetwork123%2Fsrv%2Feng%2Fxml.search.summary%3Fuuid%3D1234%26fast%3Dindex',
            headers : { 'Content-Type': 'application/xml' }
        });
    });

    it('calls success listener on success', function() {
        spyOn(Ext.Ajax, 'request').andCallFake(
            function(params) {
                params.success.call();
            }
        );
        var successCallback = jasmine.createSpy('onSuccess');
        fetcher.get(uuid, successCallback);
        expect(successCallback).toHaveBeenCalled();
    });

    it('loads retrieved record into DataCollectionStore', function() {
        var response = {
            responseXML: '<some_xml></some_xml>'
        };
        var metadataRecord = {};
        var dataCollectionRecord = {};
        spyOn(Portal.data.GeoNetworkRecordStore.prototype, 'loadData');
        spyOn(Portal.data.GeoNetworkRecordStore.prototype, 'getAt').andReturn(metadataRecord);
        spyOn(Portal.data.DataCollection, 'fromMetadataRecord').andReturn(dataCollectionRecord);
        spyOn(Ext.Ajax, 'request').andCallFake(
            function(params) {
                params.success.call(fetcher, response);
            }
        );

        fetcher.load(uuid);
        expect(Portal.data.GeoNetworkRecordStore.prototype.getAt).toHaveBeenCalled();
        expect(fetcher.dataCollectionStore.add).toHaveBeenCalledWith(dataCollectionRecord);
    });

    describe('getUuidsFromUrl', function() {

        var baseUrl = 'http://imos.aodn.org.au/portal/';
        var testCases = [
            [baseUrl + '', []],
            [baseUrl + '?', []],
            [baseUrl + '?val=something', []],
            [baseUrl + '?uuid=uuid1', 'uuid1'],
            [baseUrl + '?uuid=uuid1&val=something', 'uuid1'],
            [baseUrl + '?uuid=uuid1&uuid=uuid2', ['uuid1', 'uuid2']]
        ];

        it('returns correct values for various inputs', function() {

            Ext.each(testCases, function(testValues) {
                var testUrl = testValues[0];
                var expectedOutput = testValues[1];
                fetcher._getUrl = returns(testUrl);

                var actualOutput = fetcher.getUuidsFromUrl();

                expect(actualOutput).toEqual(expectedOutput);
            });
        });
    });
});
