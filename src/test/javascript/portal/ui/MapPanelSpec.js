
/*
 * Copyright 2012 IMOS
 *
 * The AODN/IMOS Portal is distributed under the terms of the GNU General Public License
 *
 */

describe("Portal.ui.MapPanel", function() {

    Ext.Ajax.request.isSpy = false;
    spyOn(Ext.Ajax, 'request').andReturn('');

    var appConfig = {
        initialBbox : '130,-60,160,-20',
        autoZoom : false,
        hideLayerOptions : false
    };

    var mapPanel;
    
    beforeEach(function() {
        mapPanel = new Portal.ui.MapPanel({
            appConfig : appConfig
        });
    });
    
    afterEach(function() {
        mapPanel.destroy(); 
    });

    describe('getLayerUid', function() {
        it('tests layer UID creation', function() {
            var openLayer = {
                name : 'test'
            };
            expect(mapPanel.getLayerUid(openLayer)).toEqual('UNKNOWN::test');

            openLayer.cql = 'some cql';
            expect(mapPanel.getLayerUid(openLayer)).toEqual(
                    'UNKNOWN::test::some cql');

            openLayer.url = 'http://localhost';
            expect(mapPanel.getLayerUid(openLayer)).toEqual(
                    'http://localhost::test::some cql');

            openLayer.server = {
                uri : 'http://remotehost'
            };
            expect(mapPanel.getLayerUid(openLayer)).toEqual(
                    'http://remotehost::test::some cql');
        });
    });

    describe('containsLayer', function() {
        it('tests contains layer', function() {
            var openLayer = {
                name : 'test'
            };
            mapPanel.activeLayers[mapPanel.getLayerUid(openLayer)] = openLayer;
            // As it isn't actually added to the Map so perhaps this is a
            // rubbish
            // test? It did lead to me finding an undefined reference however
            expect(mapPanel.containsLayer(openLayer)).toBeFalsy();
        });
    });

    describe('message bus tests', function() {
        
        it('updateAnimationControlsPanel called on selectedLayerChanged event', function() {
            spyOn(mapPanel, 'updateAnimationControlsPanel');
            
            Ext.MsgBus.publish('selectedLayerChanged', { isAnimatable: function() { return true;}});
            
            expect(mapPanel.updateAnimationControlsPanel).toHaveBeenCalled();
        });
    });
    
    Ext.Ajax.request.isSpy = false;
});
