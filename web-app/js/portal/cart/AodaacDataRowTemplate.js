/*
 * Copyright 2013 IMOS
 *
 * The AODN/IMOS Portal is distributed under the terms of the GNU General Public License
 *
 */
Ext.namespace('Portal.cart');

Portal.cart.AodaacDataRowTemplate = Ext.extend(Ext.XTemplate, {

    constructor: function(downloadPanelTemplate) {

        this.downloadPanelTemplate = downloadPanelTemplate;

        var templateLines = [
            '<div class="row data">',
            '  <div class="subheading">' + OpenLayers.i18n('subheadingData') + '</div>',
            '  {[this._getDataFilterEntry(values)]}',
            '  {[this._getDataDownloadEntry(values)]}',
            '</div>'
        ];

        Portal.cart.AodaacDataRowTemplate.superclass.constructor.call(this, templateLines);
    },

    applyWithControls: function(values) {

        return this._replacePlaceholdersWithControls(this.apply(values), values);
    },

    _getDataFilterEntry: function(values) {

        var aodaacParameters = values.aodaac;

        if (aodaacParameters) {

            var html = this._aodaacParamatersMarkup(aodaacParameters);

            return this.downloadPanelTemplate._makeEntryMarkup(html);
        }

        return "";
    },

    _getDataDownloadEntry: function(values) {

        var aodaacParameters = values.aodaac;
        var html;

        if (aodaacParameters) {

            html = String.format('<div id="aodaac-download-button-{0}"></div>', values.uuid); // Download button placeholder
        }
        else {

            html = this.downloadPanelTemplate._makeSecondaryTextMarkup(OpenLayers.i18n('noData'));
        }

        return this.downloadPanelTemplate._makeEntryMarkup(html);
    },

    _aodaacParamatersMarkup: function(params) {

        var areaPattern = '{0}&nbsp;N,&nbsp;{1}&nbsp;E';
        var areaStart = String.format(areaPattern, params.latitudeRangeStart, params.longitudeRangeStart);
        var areaEnd = String.format(areaPattern, params.latitudeRangeEnd, params.longitudeRangeEnd);

        return "<b>" + OpenLayers.i18n('parametersLabel') + "</b><br>" +
            this._parameterString('parameterArea', areaStart, areaEnd) +
            this._parameterString('parameterDate', params.dateRangeStart, params.dateRangeEnd) +
            this._parameterString('parameterTime', params.timeOfDayRangeStart, params.timeOfDayRangeEnd);
    },

    _parameterString: function(labelKey, value1, value2) {

        return String.format('{0}: <code>{1}</code> – <code>{2}</code><br>', OpenLayers.i18n(labelKey), value1, value2);
    },

    _replacePlaceholdersWithControls: function(html, collection) {

        var elementId = 'aodaac-download-button-' + collection.uuid;

        // Don't create button if no placeholder exists
        if (html.indexOf(elementId) >= 0) {

            this._createDownloadButton.defer(1, this, [html, OpenLayers.i18n('downloadButtonLabel'), elementId, collection]);
        }

        return html;
    },

    _createDownloadButton: function(html, value, id, collection) {

        var downloadMenu = new Ext.menu.Menu({
            items: this._createMenuItems(collection)
        });

        new Ext.Button({
            text: value,
            icon: 'images/down.png',
            scope: this,
            menu: downloadMenu
        }).render(html, id);
    },

    _createMenuItems: function(collection) {

        return [
            {text: 'Download as NetCDF', handler: this._downloadHandlerFor(collection, 'nc'), scope: this},
            {text: 'Download as HDF', handler: this._downloadHandlerFor(collection, 'hdf'), scope: this},
            {text: 'Download as ASCII text', handler: this._downloadHandlerFor(collection, 'txt'), scope: this},
            {text: 'Download as List of OpenDAP URLs', handler: this._downloadHandlerFor(collection, 'urls'), scope: this}
        ];
    },

    _downloadHandlerFor: function(collection, format, emailAddress) {

        return function() {

            // Todo - DN: We're not showing the DownloadConfirmationWindow currently

            if (!this._validateEmailAddress(emailAddress)) {

                Ext.Msg.alert(OpenLayers.i18n('aodaacDialogTitle'), OpenLayers.i18n('aodaacNoEmailAddressMsg'));
                return;
            }

            var downloadUrl = this._aodaacUrl(collection.aodaac, format, emailAddress);

            Ext.Ajax.request({
                url: downloadUrl,
                scope: this,
                success: function() {
                    Ext.Msg.alert(OpenLayers.i18n('aodaacDialogTitle'), OpenLayers.i18n('aodaacJobCreatedMsg', {email: emailAddress}));
                },
                failure: function() {
                    Ext.Msg.alert(OpenLayers.i18n('aodaacDialogTitle'), OpenLayers.i18n('aodaacJobCreateErrorMsg'));
                }
            });
        };
    },

    _aodaacUrl: function(params, format, emailAddress) {

        var args = "outputFormat=" + format;
        args += "&dateRangeStart=" + params.dateRangeStart;
        args += "&dateRangeEnd=" + params.dateRangeEnd;
        args += "&timeOfDayRangeStart=" + params.timeOfDayRangeStart;
        args += "&timeOfDayRangeEnd=" + params.timeOfDayRangeEnd;
        args += "&latitudeRangeStart=" + params.latitudeRangeStart;
        args += "&latitudeRangeEnd=" + params.latitudeRangeEnd;
        args += "&longitudeRangeStart=" + params.longitudeRangeStart;
        args += "&longitudeRangeEnd=" + params.longitudeRangeEnd;
        args += "&productId=" + params.productId;
        args += "&notificationEmailAddress=" + emailAddress;

        return 'aodaac/createJob?' + args;
    },

    _validateEmailAddress: function(address) {

        if (!address) {
            return false;
        }

        // From http://stackoverflow.com/questions/46155/validate-email-address-in-javascript
        var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(address);
    }
});
