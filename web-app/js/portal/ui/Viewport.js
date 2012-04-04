Ext.namespace('Portal.ui');

Portal.ui.Viewport = Ext.extend(Ext.Viewport, {
  constructor: function(cfg) {
    this.mainTabPanel = new Portal.ui.MainTabPanel({
      region: 'center'
    });

    this.layerChooserPanel = new Portal.ui.LayerChooserPanel({ 
      region: 'west', 
      appConfig: cfg.appConfig, 
      mapPanel: this.mainTabPanel.getMapPanel(),
      width: cfg.appConfig.westWidth
    });

    var config = Ext.apply({
      layout: 'border',
      boxMinWidth: 1050,
      items: [
        {
          unstyled: true,
          region: 'north',
          height: cfg.appConfig.headerHeight + 15
        },
        this.mainTabPanel,
        {
          region: 'south',
          height: 15,
          unstyled: true
        },
        this.layerChooserPanel

        ]}, cfg);

    Portal.ui.Viewport.superclass.constructor.call(this, config);

  },
  
  initComponent: function() {
    Portal.ui.Viewport.superclass.initComponent.call(this);
    
    this.mon(this.mainTabPanel, 'tabchange', this.onPanelTabChange, this);

    //TODO: find a better home for this
    this.on('afterrender', function() {              
      jQuery("#loader").hide('slow'); // close the loader            
    });
  },

  setActiveTab:  function(tabIndex) {
    this.mainTabPanel.setActiveTab(tabIndex);
  },

  isMapVisible: function() {
    return this.mainTabPanel.isMapVisible();
  },

  onPanelTabChange: function(thisTabPanel, newTab) {
    if (newTab === this.mainTabPanel.portalPanel) {
      this.layerChooserPanel.expand();
      this.layerChooserPanel.showActions();
    }
    else if (newTab === this.mainTabPanel.searchTabPanel) {
      this.layerChooserPanel.collapse();
    } 
    else {
      this.layerChooserPanel.expand();
      this.layerChooserPanel.hideActions();
      this.layerChooserPanel.doLayout();
    }
  }

});

