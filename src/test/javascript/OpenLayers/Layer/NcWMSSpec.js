/*
 * Copyright 2013 IMOS
 *
 * The AODN/IMOS Portal is distributed under the terms of the GNU General Public License
 *
 */
describe("OpenLayers.Layer.NcWMS", function() {
    var cachedLayer;
    var extent;
    var params;

    beforeEach(function() {
        OpenLayers.Layer.WMS.prototype.getURL = function(bounds) {
            return "http://someurl/page?param1=blaa";
        };

        params = {};

/*        var extent = [
            '2001-02-01T00:00',
            '2001-02-03T00:00',
            '2001-02-05T00:00'];*/

        cachedLayer = new OpenLayers.Layer.NcWMS(
            null,
            null,
            params,
            null,
            { extent: extent }
        );
/*
        cachedLayer.processTemporalExtent();*/
        //cachedLayer.temporalExtent.isValid = function() {return true};

        cachedLayer.mergeNewParams = noOp;
    });

    describe('constructor', function() {
        it('extent given', function() {
            var extent = [
                '2001-02-01T00:00',
                '2001-02-03T00:00',
                '2001-02-05T00:00'];

            cachedLayer = new OpenLayers.Layer.NcWMS(
                null,
                null,
                params,
                null,
                { extent: extent }
            );
            cachedLayer.processTemporalExtent();

            waitsFor(function() {
                return cachedLayer.temporalExtent;
            }, "Temporal extent not processed", 1000);

            expect(cachedLayer.temporalExtent).not.toBeUndefined();
            expect(cachedLayer.temporalExtent.length()).toEqual(3);
        });
    });

    describe("getURL", function() {

        var time = moment('2011-07-08T03:32:45Z').utc();
        var bounds = new OpenLayers.Bounds({
            left: 0,
            right: 10,
            top: 0,
            bottom: 10
        });

        beforeEach(function() {
            cachedLayer.temporalExtent = null;
            cachedLayer.rawTemporalExtent = [
                '2011-07-02T01:32:45Z',
                '2011-07-08T01:32:45Z',
                '2011-07-08T03:22:45Z',
                '2011-07-08T03:32:45Z'
            ];
            cachedLayer.processTemporalExtent();
        });

        it('time specified', function() {
            cachedLayer.toTime(time);
            expect(cachedLayer.getURL(bounds).split('&')).toContain('TIME=' + time.utc().format('YYYY-MM-DDTHH:mm:ss.SSS'));
        });

        it('no time specified', function() {
            cachedLayer.toTime(null);
            expect(cachedLayer.getURL(bounds).split('&')).not.toContain('TIME=' + time.format());
        });

        it('getURLAtTime', function() {
            var dateTime = moment('2000-02-02T01:01:01+00:00');
            expect(cachedLayer.getURLAtTime(bounds, dateTime).split('&')).toContain('TIME=2000-02-02T01:01:01.000');
        });
    });

    it("extent as array of strings", function() {
        cachedLayer.temporalExtent = null;
        cachedLayer.rawTemporalExtent = [
            '2001-01-01T00:00:00',
            '2001-01-02T00:00:00',
            '2001-01-03T00:00:00'
        ];
        cachedLayer.processTemporalExtent();

        waitsFor(function() {
            return cachedLayer.temporalExtent;
        }, "Temporal extent not processed", 1000);

        expect(cachedLayer.temporalExtent.extent[0]).toBeSame(moment.utc('2001-01-01T00:00:00'));
        expect(cachedLayer.temporalExtent.extent[1]).toBeSame(moment.utc('2001-01-02T00:00:00'));
        expect(cachedLayer.temporalExtent.extent[2]).toBeSame(moment.utc('2001-01-03T00:00:00'));
    });

    it("extent as repeating interval", function() {
        // I *think* there can be a 'Rn' at the beginning, but doesn't look like helper.js handles
        // that.

        //  TODO: hangs browser :-)
        //cachedLayer.setTemporalExtent('2000-01-01T00:00:00.000/2000-01-03T00:00:00.000/PT1D');

        cachedLayer.temporalExtent = null;
        cachedLayer.rawTemporalExtent = ['2001-01-01T00:00:00/2001-01-03T00:00:00/PT24H'];
        cachedLayer.processTemporalExtent();
        waitsFor(function() {
            return cachedLayer.temporalExtent;
        }, "Temporal extent not processed", 1000);

        var expectedDates = [
            moment.utc('2001-01-01T00:00:00'),
            moment.utc('2001-01-02T00:00:00'),
            moment.utc('2001-01-03T00:00:00')
        ];

        for (var i = 0; i < expectedDates.length; i++) {
            expect(cachedLayer.temporalExtent.extent[i]).toBeSame(expectedDates[i]);
        }
    });

    describe('get next time', function() {
        beforeEach(function() {
            cachedLayer.temporalExtent = null;
            cachedLayer.rawTemporalExtent = ['2001-01-01T00:00:00', '2001-01-02T00:00:00', '2001-01-03T00:00:00'];
            cachedLayer.processTemporalExtent();
            waitsFor(function() {
                return cachedLayer.temporalExtent;
            }, "Temporal extent not processed", 1000);
        });

        it('next item returned', function() {
            cachedLayer.toTime(cachedLayer.temporalExtent.min());
            var res = cachedLayer.nextTimeSlice();
            expect(res).toBeSame(moment.utc('2001-01-02T00:00:00'));
        });

        it('no more items', function() {
            cachedLayer.toTime(cachedLayer.temporalExtent.max());
            var res = cachedLayer.nextTimeSlice();
            expect(res).toBeSame(moment.utc('2001-01-03T00:00:00'));
        });
    });

    describe('choose nearest available time', function() {


        describe('repeating interval', function() {
            beforeEach(function() {
                cachedLayer.rawTemporalExtent = ['2000-01-01T00:00:00.000/2000-01-01T01:00:00.000/PT30M'];
                cachedLayer.temporalExtent = null;
                cachedLayer.processTemporalExtent();
                waitsFor(function() {
                    return cachedLayer.temporalExtent;
                }, "Temporal extent not processed", 1000);
            });

            it('around first date/time', function() {
                cachedLayer.toTime(moment.utc('2000-01-01T00:00:00.000'));
                expect(cachedLayer.nextTimeSlice()).toBeSame(moment.utc('2000-01-01T00:30:00.000'));
                cachedLayer.toTime(moment.utc('2000-01-01T00:00:01.000'));
                expect(cachedLayer.nextTimeSlice()).toBeSame(moment.utc('2000-01-01T00:30:00.000'));
            });

            it ('around half way between two possible values', function() {
                cachedLayer.toTime(moment.utc('2000-01-01T00:15:00.000'));
                expect(cachedLayer.nextTimeSlice()).toBeSame(moment.utc('2000-01-01T00:30:00.000'));
                cachedLayer.toTime(moment.utc('2000-01-01T00:15:01.000'));
                expect(cachedLayer.nextTimeSlice()).toBeSame(moment.utc('2000-01-01T00:30:00.000'));
            });

            it ('around last date/time', function() {
                cachedLayer.toTime(moment.utc('2000-01-01T01:00:00.000'));
                expect(cachedLayer.nextTimeSlice().valueOf()).toEqual(moment.utc('2000-01-01T01:00:00.000').valueOf());
                cachedLayer.toTime(moment.utc('2000-01-01T00:59:59.000'));
                expect(cachedLayer.nextTimeSlice().valueOf()).toEqual(moment.utc('2000-01-01T01:00:00.000').valueOf());
                cachedLayer.toTime(moment.utc('2000-01-01T01:00:01.000'));
                expect(cachedLayer.nextTimeSlice().valueOf()).toEqual(moment.utc('2000-01-01T01:00:01.000').valueOf());
            });
        });

        describe('time set specified', function() {
            beforeEach(function() {
                cachedLayer.rawTemporalExtent = [
                    '2000-01-01T00:00:00.000',
                    '2000-01-02T00:00:00.000',
                    '2000-01-03T00:00:00.000'
                ];
                cachedLayer.temporalExtent = null;
                cachedLayer.processTemporalExtent();
                waitsFor(function() {
                    return cachedLayer.temporalExtent;
                }, "Temporal extent not processed", 1000);
            });

            it('before first date/time', function() {
                cachedLayer.toTime(moment.utc('1900-12-31T23:59:59.000'));
                expect(cachedLayer.nextTimeSlice()).not.toBeSame(moment.utc('2000-01-03T00:00:00.000'));
                cachedLayer.toTime(moment.utc('1999-12-31T23:59:59.000'));
                expect(cachedLayer.nextTimeSlice()).not.toBeSame(moment.utc('1999-12-31T23:59:59.000'));
            });
            it('around first date/time', function() {
                cachedLayer.toTime(moment.utc('2000-01-01T00:00:00.000'));
                expect(cachedLayer.nextTimeSlice()).toBeSame(moment.utc('2000-01-02T00:00:00.000'));
                cachedLayer.toTime(moment.utc('2000-01-01T00:00:01.000'));
                expect(cachedLayer.nextTimeSlice()).toBeSame(moment.utc('2000-01-02T00:00:00.000'));
            });

            it('around half way between two possible values', function() {
                cachedLayer.toTime(moment.utc('2000-01-01T11:59:59.000'));
                expect(cachedLayer.nextTimeSlice()).toBeSame(moment.utc('2000-01-02T00:00:00.000'));
                cachedLayer.toTime(moment.utc('2000-01-01T12:00:00.000'));
                expect(cachedLayer.nextTimeSlice()).toBeSame(moment.utc('2000-01-02T00:00:00.000'));
                cachedLayer.toTime(moment.utc('2000-01-01T12:00:01.000'));
                expect(cachedLayer.nextTimeSlice()).toBeSame(moment.utc('2000-01-02T00:00:00.000'));
            });

            it('around last date/time', function() {
                cachedLayer.toTime(moment.utc('2000-01-02T23:59:59.000'));
                expect(cachedLayer.nextTimeSlice().valueOf()).toEqual(moment.utc('2000-01-03T00:00:00.000').valueOf());
                cachedLayer.toTime(moment.utc('2000-01-03T00:00:00.000'));
                expect(cachedLayer.nextTimeSlice().valueOf()).toEqual(moment.utc('2000-01-03T00:00:00.000').valueOf());
                cachedLayer.toTime(moment.utc('2000-01-03T00:00:01.000'));
                expect(cachedLayer.nextTimeSlice().valueOf()).toEqual(moment.utc('2000-01-03T00:00:01.000').valueOf());
            });

            it('after last date/time', function() {
                cachedLayer.toTime(moment.utc('2010-01-03T00:00:00.000'));
                expect(cachedLayer.nextTimeSlice().valueOf()).not.toEqual(moment.utc('2010-01-03T00:00:00.000').valueOf());
            });
        });
    });

    describe('getExtent min/max', function() {
        beforeEach(function() {
            var extent = [
                '2001-02-01T00:00',
                '2001-02-03T00:00',
                '2001-02-05T00:00'
            ];

            cachedLayer = new OpenLayers.Layer.NcWMS(
                null,
                null,
                params,
                null,
                { extent: extent }
            );

            cachedLayer.temporalExtent = null;
            cachedLayer.processTemporalExtent();
            waitsFor(function() {
                return cachedLayer.temporalExtent;
            }, "Temporal extent not processed", 1000);

        });

        it('getTemporalExtentMin value', function() {
            expect(cachedLayer.getTemporalExtentMin()).toBeSame(moment.utc('2001-02-01T00:00'));
        });

        it('getTemporalExtentMax value', function() {
            expect(cachedLayer.getTemporalExtentMax()).toBeSame(moment.utc('2001-02-05T00:00'));
        });
    });

    describe('subset extent', function() {
        beforeEach(function() {
            cachedLayer.rawTemporalExtent = [
                '2000-01-01T00:00:00.000',
                '2000-01-02T00:00:00.000',
                '2000-01-03T00:00:00.000'
            ];
            cachedLayer.temporalExtent = null;
            cachedLayer.processTemporalExtent();
            waitsFor(function() {
                return cachedLayer.temporalExtent;
            }, "Temporal extent not processed", 1000);
        });

        it('sets the subset extent minimum', function() {
            expect(cachedLayer.getSubsetExtentMin()).toEqual(moment.utc('2000-01-01T00:00:00.000'));
        });

        it('sets the subset extent maximum', function() {
            expect(cachedLayer.getSubsetExtentMax()).toEqual(moment.utc('2000-01-03T00:00:00.000'));
        });
    });
});
