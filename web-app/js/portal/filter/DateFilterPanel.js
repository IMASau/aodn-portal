/*
 * Copyright 2012 IMOS
 *
 * The AODN/IMOS Portal is distributed under the terms of the GNU General Public License
 *
 */

Ext.namespace('Portal.filter');

Portal.filter.DateFilterPanel = Ext.extend(Portal.filter.BaseFilterPanel, {

    constructor: function(cfg) {
        var config = Ext.apply({
            layout: 'menu',
            layoutConfig: {
                padding: '5',
                align: 'left'
            }
        }, cfg );

        this.TIME_UTIL = new Portal.utils.TimeUtil();
        Portal.filter.DateFilterPanel.superclass.constructor.call(this, config);
    },

    _createField: function() {
        this.operators = new Ext.form.ComboBox({
            triggerAction: 'all',
            mode: 'local',
            width: 165,
            editable: false,
            emptyText: OpenLayers.i18n("pleasePickCondensed"),
            fieldLabel: "Time",
            store: new Ext.data.ArrayStore({
                fields: [
                    'op'
                ],
                data: [[OpenLayers.i18n("comboOptionNone")], [OpenLayers.i18n("comboOptionBefore")], [OpenLayers.i18n("comboOptionAfter")], [OpenLayers.i18n("comboOptionBetween")]]
            }),
            valueField: 'op',
            displayField: 'op',
            listeners: {
                scope: this,
                select: this._opSelect
            }
        });

        this.fromField = new Ext.form.DateField({
            name: 'from',
            format: "d/m/Y",
            maxValue: new Date(),
            minValue: new Date(0),
            width: 165,
            listeners: {
                scope: this,
                select: this._onSelect,
                change: this._onSelect
            }
        });

        this.toField = new Ext.form.DateField({
            name: 'to',
            format: "d/m/Y",
            hidden: true,
            maxValue: new Date(),
            minValue: new Date(0),
            width: 165,
            listeners: {
                scope: this,
                select: this._onSelect,
                change: this._onSelect
            }
        });

        this.add(this.operators);
        this.add(this.fromField);
        this.add(this.toField);

        if (this.filter.possibleValues != undefined) {
            this._setMinMax(this.fromField, this.filter.possibleValues);
            this._setMinMax(this.toField, this.filter.possibleValues);
        }
    },

    _setMinMax: function(dateField, vals) {
        dateField.setMinValue(this.TIME_UTIL._parseIso8601Date(vals[0]));

        if (vals.length == 2) {
            dateField.setMaxValue(this.TIME_UTIL._parseIso8601Date(vals[1]));
        }
    },

    _opSelect: function(combo, row, index) {
        if (this._isSelectedOpSetToNone()) {
            this.handleRemoveFilter();
            this._fireAddEvent();
        }
        else {
            this.toField.setVisible(this._isSelectedOpSetToBetween());
            this._applyDateFilterPanel();
        }
    },

    _isSelectedOpSetToNone: function() {
        return this.operators.getValue() == 'none';
    },

    _isSelectedOpSetToBetween: function() {
        return this.operators.getValue() == 'between';
    },

    _isSelectedOpSetToAfter: function() {
        return this.operators.getValue() == 'after';
    },

    _isSelectedOpSetToBefore: function() {
        return this.operators.getValue() == 'before';
    },

    _getDateString: function(combo) {
          return combo.getValue().toDateString();
    },

    _onSelect: function(picker, date) {
    	if (this._isSelectedOpSetToBetween) {
    	    if (this.toField.isVisible()) {
    	        this.toField.setMinValue(this.fromField.getValue());
    	    }
    	}
        this._applyDateFilterPanel();
    },

    _applyDateFilterPanel: function() {
        if (this._requiredFieldsSet()) {
            this._fireAddEvent();
        }
    },

    getCQL: function() {
        return this._getCQLUsingColumnNames(this.filter.name, this.filter.name);
    },

    _getCQLUsingColumnNames: function(startDateRangeColumnName, endDateRangeColumnName) {

        if (!this.fromField.getValue()) {
            return '';
        }

        var cql = '';

        if (this._isSelectedOpSetToBetween()) {
            cql += String.format(
                "{0} after {1} AND {2} before {3}",
                endDateRangeColumnName,
                this._getDateString(this.fromField),
                startDateRangeColumnName,
                this._getDateString(this.toField));
        }
        else if (this._isSelectedOpSetToAfter()) {
            cql += String.format("{0} after {1}", endDateRangeColumnName, this._getDateString(this.fromField));
        }
        else if (this._isSelectedOpSetToBefore()) {
            cql += String.format("{0} before {1}", startDateRangeColumnName, this._getDateString(this.fromField));
        }

        return cql;
    },

    _requiredFieldsSet: function() {
        var requiredFields = [this.operators.getValue(), this.fromField.getValue()];
        if (this.operators.getValue() == 'between') {
            requiredFields.push(this.toField.getValue());
        }
        return this._all(requiredFields);
    },

    _all: function(array) {
        var ret = true;
        Ext.each(array, function(item, index, allItems) {
            if (!item) {
                ret = false;
            }
        }, this);

        return ret;
    },

    handleRemoveFilter: function() {
        this.operators.clearValue();
        this.toField.reset();
        this.fromField.reset();

        if (this.toField.isVisible()) {
            this.toField.setMinValue(new Date(0));
        }

        this.CQL = "";
    },

    _setExistingFilters: function() {
        var beforePattern = this.filter.name + " before (.*?)( |$)";
        var afterPattern = this.filter.name + " after (.*?)( |$)";

        betweenRe = new RegExp(afterPattern + "AND " + beforePattern);
        beforeRe = new RegExp(beforePattern);
        afterRe = new RegExp(afterPattern);

        var m = beforeRe.exec(this.layer.getDownloadFilter());
        var m2 = afterRe.exec(this.layer.getDownloadFilter());
        var between = betweenRe.exec(this.layer.getDownloadFilter());

        if (between != null && between.length == 5) {
            this.operators.setValue('between');
            this.fromField.setValue(this.TIME_UTIL._parseIso8601Date(between[1]));
            this.toField.setVisible(true);
            this.toField.setValue(this.TIME_UTIL._parseIso8601Date(between[3]));
        }
        else {
            if (m != null && m.length == 3) {
                this.operators.setValue('before');
                this.fromField.setValue(this.TIME_UTIL._parseIso8601Date(m[1]));
            }
            else if (m2 != null && m2.length == 3) {
                this.operators.setValue('after');
                this.fromField.setValue(this.TIME_UTIL._parseIso8601Date(m2[1]));
            }
        }
    }
});
