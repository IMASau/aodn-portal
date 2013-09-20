
/*
 * Copyright 2013 IMOS
 *
 * The AODN/IMOS Portal is distributed under the terms of the GNU General Public License
 *
 */

describe('Portal.cart.WfsDataRowTemplate', function() {

    var html;
    var parentTemplate;
    var tpl;
    var geoNetworkRecord;

    beforeEach(function() {

        parentTemplate = new Portal.cart.DownloadPanelTemplate();
        tpl = new Portal.cart.WfsDataRowTemplate(parentTemplate);
        geoNetworkRecord = {
            uuid: 9,
            wmsLayer: {
                getCqlFilter: function() {
                    return "cql_filter"
                }
            }
        };
    });

    describe('_getDataFilterEntry', function() {

        beforeEach(function() {

            spyOn(parentTemplate, '_makeEntryMarkup').andReturn('entry markup');
        });

        it('returns the entry markup', function() {

            var html = tpl._getDataFilterEntry(geoNetworkRecord);

            expect(html).toBe('entry markup');
        });

        it('calls entry markup with filter description', function() {

            var html = tpl._getDataFilterEntry(geoNetworkRecord);

            expect(parentTemplate._makeEntryMarkup).toHaveBeenCalledWith('<b>' + OpenLayers.i18n('filterLabel') + '</b> <code>cql_filter</code>');
        });

        it('calls entry markup with no filter message', function() {

            geoNetworkRecord.wmsLayer.getCqlFilter = function() { return null };

            var html = tpl._getDataFilterEntry(geoNetworkRecord);

            expect(parentTemplate._makeEntryMarkup).toHaveBeenCalledWith(OpenLayers.i18n('noFilterApplied'));
        });

        it('returns empty string when no layer', function() {

            geoNetworkRecord.wmsLayer = null;

            var html = tpl._getDataFilterEntry(geoNetworkRecord);

            expect(html).toBe('');
            expect(parentTemplate._makeEntryMarkup).not.toHaveBeenCalled();
        });

        afterEach(function() {

            parentTemplate._makeEntryMarkup.reset();
        });
    });

    describe('_getDataDownloadEntry', function() {

        var html;

        beforeEach(function() {

            spyOn(parentTemplate, '_makeEntryMarkup').andReturn('entry markup');

            html = tpl._getDataDownloadEntry(geoNetworkRecord);
        });

        it('returns the entry markup', function() {

            expect(html).toBe('entry markup');
        });

        it('include placeholder when layer is present', function() {

            expect(parentTemplate._makeEntryMarkup).toHaveBeenCalledWith('<div id="wfs-download-button-9"></div>');
        });

        it('include message when there is no layer', function() {

            geoNetworkRecord.wmsLayer = null;

            tpl._getDataDownloadEntry(geoNetworkRecord);

            expect(parentTemplate._makeEntryMarkup).toHaveBeenCalledWith('<span class="secondary-text">' + OpenLayers.i18n('noData') + '</span>');
        });

        afterEach(function() {

            parentTemplate._makeEntryMarkup.reset();
        });
    });

    describe('template output', function() {

        var row;
        var rowHeading;

        beforeEach(function() {

            tpl._getDataFilterEntry = function() { return "data_filter" };
            tpl._getDataDownloadEntry = function() { return "data_download" };

            var html = tpl.apply(geoNetworkRecord);
            row = $(html);

            rowHeading = $(row.children()[0]);
        });

        describe('download row', function() {

            it('has the correct class', function() {

                expect(row.attr('class')).toBe('row');
            });

            it('has correct number of children', function() {

                expect(row.children().length).toBe(1);
            });

            it('has correct row heading', function() {

                expect(rowHeading.attr('class')).toBe('subheading');
                expect(rowHeading.text()).toBe(OpenLayers.i18n('subheadingData'));
            });

            it('has correct text value from function', function() {

                var rowText = getText(row);

                expect(rowText.length).toBe(2);
                expect(rowText[0]).toBe('data_filter');
                expect(rowText[1]).toBe('data_download');
            });
        });
    });

    function getText(element) {

        // Based on http://stackoverflow.com/questions/298750/how-do-i-select-text-nodes-with-jquery

        var text = $(element)
            .contents()
            .filter(function() {
                return this.nodeType === Node.TEXT_NODE;
            }).text();

        var elements = text.split(" ").filter(function(val) { return val.length });

        return (elements.length == 1) ? elements[0] : elements;
    }
});
