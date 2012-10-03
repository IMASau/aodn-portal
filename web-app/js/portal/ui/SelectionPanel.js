Ext.namespace('Portal.ui');

Portal.ui.SelectionPanel = Ext.extend(Ext.Panel, {

	constructor: function(config) {

	    this.searchPanel = new Portal.ui.search.SearchPanel({
	    	itemId: 'searchPanel',
		    //title: config.searchTabTitle,
            proxyUrl: proxyURL,
		    catalogUrl: Portal.app.config.catalogUrl,
		    protocols: config.searchRestriction.protocols,
		    dragAndDrop: config.dragAndDrop
		});

		config = Ext.apply({
			layout: 'fit',
			layoutConfig: {
				align: 'stretch'
			},
			header: false,
			items: [
                this.searchPanel
			]
		}, config);

		Portal.ui.SelectionPanel.superclass.constructor.call(this, config);

		this.relayEvents(this.searchPanel, ['adddownload', 'addlayer']);
	}
});
