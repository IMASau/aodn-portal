Ext.namespace('Portal.search.data');

Portal.search.data.LinkStore = Ext.extend(Ext.data.JsonStore, {
	constructor: function(cfg) {
		cfg = cfg || {};
		
		var config = Ext.apply({
			root: 'links',
			fields: [
				{name: 'url', mapping: 'href'},
				{name: 'name'},
				{name: 'protocol'},
				{name: 'title'},
				{name: 'type'}
			]
		}, cfg);
		
		Portal.search.data.LinkStore.superclass.constructor.call(this, config);
	},
	
	getLink: function(index) {
		var linkRec = this.getAt(index);
		
		if (linkRec === undefined) {
			return undefined;
		};
		
		return {
			name: linkRec.get('title'),
			server: {
				uri: linkRec.get('url'),
				type: 'WMS'
			},
			layers: linkRec.get('name'),
			protocol: linkRec.get('protocol')
		};
	}
});
