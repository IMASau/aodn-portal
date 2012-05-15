Ext.namespace('Portal.search');

Portal.search.FilterSelector = Ext.extend(Ext.Container, {
  
  constructor: function(cfg) {
    this.filterCombo = new Portal.search.filter.FilterComboBox({
      store: cfg.store,
      anchor: '-2'  // prevents combo selector image being cut-off
    });
    
    var config = Ext.apply({
        layout: 'hbox',
        autoHeight: true,
        cls: 'searchField',
        items: [
          {
            xtype: 'spacer',
            flex: 1  // right justify filter combo below
          },
          {
            xtype: 'container',
            autoHeight: true,
            width: 250,
            layout: 'form',  // to get field label
            items: [this.filterCombo]
          }
        ]
      }, cfg);

    Portal.search.FilterSelector.superclass.constructor.call(this, config);
    
    this.relayEvents(this.filterCombo, ['filteradd']);
  }
  
});
