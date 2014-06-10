/*
 * Copyright 2013 IMOS
 *
 * The AODN/IMOS Portal is distributed under the terms of the GNU General Public License
 *
 */
describe("Portal.filter.DateRangeFilterPanelSpec", function() {

    describe('CQL', function() {
        var filterPanel;

        beforeEach(function() {
            filterPanel = new Portal.filter.DateRangeFilterPanel({
                filter: {
                    name: 'wfs_column',
                    wmsStartDateName: 'wms_start_column',
                    wmsEndDateName: 'wms_end_column'
                },
                layer: {
                    getDownloadFilter: function() {}
                },
                setLayerAndFilter: noOp
            });
            
            var mockDate = function() {
                return {
                    getValue: function() {
                        return '';
                    },
                    hasValue: function() {
                        return false;
                    }
                }
            }
            
            filterPanel.fromDate = mockDate();
            filterPanel.toDate = mockDate();

            spyOn(filterPanel, '_getDateString').andCallFake(function(combo) {
                return combo.getValue()
            });
        });

        it('after', function() {
            setTestValue(filterPanel.fromDate, '2000');
            
            expectAllCQLFunctionsToEqual(filterPanel, 'wms_end_column >= 2000', 'wfs_column >= 2000');
        });

        it('before', function() {
            setTestValue(filterPanel.toDate, '2013');

            expectAllCQLFunctionsToEqual(filterPanel, 'wms_start_column <= 2013', 'wfs_column <= 2013');
        });

        it('between', function() {
            setTestValue(filterPanel.fromDate, '2000');
            setTestValue(filterPanel.toDate, '2013');
            
            expectAllCQLFunctionsToEqual(
                filterPanel,
                'wms_end_column >= 2000 AND wms_start_column <= 2013',
                'wfs_column >= 2000 AND wfs_column <= 2013'
            );
        });

        var expectAllCQLFunctionsToEqual = function(filterPanel, visualisationCQL, downloadCQL) {
            expect(filterPanel.getVisualisationCQL()).toEqual(visualisationCQL);
            expect(filterPanel.getDownloadCQL()).toEqual(downloadCQL);
        }

        var setTestValue = function(resettableDate, value) {
            spyOn(resettableDate, 'getValue').andReturn(value);
            spyOn(resettableDate, 'hasValue').andReturn(true);
        } 
    });
});
