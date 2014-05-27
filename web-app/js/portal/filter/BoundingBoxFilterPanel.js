/*
 * Copyright 2012 IMOS
 *
 * The AODN/IMOS Portal is distributed under the terms of the GNU General Public License
 *
 */

Ext.namespace('Portal.filter');

Portal.filter.BoundingBoxFilterPanel = Ext.extend(Portal.filter.BaseFilterPanel, {

    constructor: function(cfg) {

        Portal.filter.BoundingBoxFilterPanel.superclass.constructor.call(this, cfg);

        this.map = cfg.layer.map;
        this.map.events.on({
            scope: this,
            'spatialconstraintadded': function(geometry) {
                this._updateWithGeometry(geometry);
            },
            'spatialconstraintcleared': function() {
                this._updateWithGeometry();
            }
        });
    },

    _createField: function() {
        this.spatialSubsetControlsPanel = new Portal.details.SpatialSubsetControlsPanel({
            map: this.layer.map
        });
        this.add(this.spatialSubsetControlsPanel);
    },

    isDownloadOnly: function() {
        return true;
    },

    handleRemoveFilter: function() {

        if (this.map.spatialConstraintControl) {
            this.map.spatialConstraintControl.clear();
        }
        this.map.events.triggerEvent('spatialconstraintcleared');
    },

    getFilterName: function() {
        return undefined;
    },

    setLayerAndFilter: function(layer, filter) {
        Portal.filter.BoundingBoxFilterPanel.superclass.setLayerAndFilter.apply(this, arguments);
        if (layer.map.spatialConstraintControl) {
            this._updateWithGeometry(layer.map.spatialConstraintControl.getConstraint());
        }
    },

    _updateWithGeometry: function(geometry) {
        this.geometry = geometry;
        this._fireAddEvent();
    },

    _setExistingFilters: function() {
        // Never restored from an existing filter
    },

    getCQL: function() {

        if (!this.geometry) {
            return undefined;
        }

        return String.format(
            "INTERSECTS({0},{1})",
            this.filter.name,
            this.geometry.toWkt()
        );
    },

    getHumanGeometryValue: function() {

        if (this.geometry) {
            var explanation = (this.geometry.isBox()) ? OpenLayers.i18n("boundingBoxDescription") : OpenLayers.i18n("maxExtentOfPolygon");
            return String.format('{0}: {1}',explanation, this.geometry.getBounds());
        }
        else {
            return "";
        }
    },

    getFilterData: function() {

        return {
            name: this.filter.name,
            downloadOnly: this.isDownloadOnly(),
            cql: this.getCQL(),
            humanValue: this.getHumanGeometryValue()
        }
    }


});
