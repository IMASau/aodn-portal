/*
 * Copyright 2015 IMOS
 *
 * The AODN/IMOS Portal is distributed under the terms of the GNU General Public License
 *
 */

describe("Portal.filter.FilterService", function() {

    var service = new Portal.filter.FilterService();
    var successCallback;
    var failureCallback;
    var callbackScope;
    var testLayer;

    beforeEach(function() {

        successCallback = jasmine.createSpy('successCallback');
        failureCallback = jasmine.createSpy('failureCallback');
        callbackScope = {};
        testLayer = {
            server: {}
        };
    });

    describe('loadFilters', function() {

        it('calls success callback', function() {

            spyOnAjaxAndReturn('[]', 200);

            service.loadFilters(
                testLayer,
                successCallback,
                failureCallback,
                callbackScope
            );

            expect(successCallback).toHaveBeenCalledWith([]);
            expect(failureCallback).not.toHaveBeenCalled();
        });

        it('calls failure callback', function() {

            spyOnAjaxAndReturn(null, 500);

            service.loadFilters(
                testLayer,
                successCallback,
                failureCallback,
                callbackScope
            );

            expect(successCallback).not.toHaveBeenCalled();
            expect(failureCallback).toHaveBeenCalled();
        });
    });

    describe('loadFilterRange', function() {

        it('calls success callback', function() {

            spyOnAjaxAndReturn('[]', 200);

            service.loadFilterRange(
                'some_filter',
                testLayer,
                successCallback,
                failureCallback,
                callbackScope
            );

            expect(successCallback).toHaveBeenCalledWith([]);
            expect(failureCallback).not.toHaveBeenCalled();
        });

        it('calls failure callback', function() {

            spyOnAjaxAndReturn(null, 500);

            service.loadFilterRange(
                'some_filter',
                testLayer,
                successCallback,
                failureCallback,
                callbackScope
            );

            expect(successCallback).not.toHaveBeenCalled();
            expect(failureCallback).toHaveBeenCalled();
        });
    });

    describe('_filterLayerName', function() {

        var layer;

        beforeEach(function() {

            layer = {
                wmsName: 'wmsName'
            };
        });

        it('should use download layer if present', function() {

            layer.getDownloadLayer = function() { return 'wfsName'; };

            expect(service._filterLayerName(layer)).toBe('wfsName');
        });

        it('should use map layer otherwise', function() {

            expect(service._filterLayerName(layer)).toBe('wmsName');
        });
    });

    var spyOnAjaxAndReturn = function(responseText, status) {
        spyOn(Ext.Ajax, 'request').andCallFake(function(opts) {

            var response = {
                responseText: responseText,
                status: status
            };

            var callback = status == 200 ? opts.success : opts.failure;

            callback.call(opts.scope, response, opts)
        });
    };
});
