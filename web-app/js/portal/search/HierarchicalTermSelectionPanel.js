/*
 * Copyright 2014 IMOS
 *
 * The AODN/IMOS Portal is distributed under the terms of the GNU General Public License
 *
 */

Ext.namespace('Portal.search');

Portal.search.HierarchicalTermSelectionPanel = Ext.extend(Ext.tree.TreePanel, {

    constructor: function(cfg) {

        cfg = cfg || {};

        cfg.title = '<span class="term-selection-panel-header">' + cfg.title + '</span>';

        cfg = Ext.apply({
            // TODO: initialise with actual node if it exists.
            animate: false,
            root: new Ext.tree.TreeNode(),
            containerScroll: true,
            autoScroll: true,
            collapsible: true,
            titleCollapse: true,
            singleExpand: true,
            rootVisible: false,
            cls: "search-filter-panel term-selection-panel",
            lines: false
        }, cfg);

        Portal.search.HierarchicalTermSelectionPanel.superclass.constructor.call(this, cfg);

        this.getSelectionModel().on('selectionchange', this._onSelectionChange, this);
        this.mon(this.searcher, 'hiersearchcomplete', function() {
            this._onSearchComplete();
        }, this);
    },

    removeAnyFilters: function() {
        this.root = new Ext.tree.TreeNode();
        this.searcher.removeDrilldownFilters();
    },

    _onSelectionChange: function(selectionModel, node) {

        // todo can we have leaf information in the model?
        if (!node.hasChildNodes()) {
            this.searcher.addDrilldownFilter(node.toValueHierarchy());
            this.searcher.search();
        }
        else {
            node.expand();
        }
    },

    _onSearchComplete: function() {
        var node = this.searcher.getDimensionNodeByValue(this.dimensionValue);
        this.setRootNode(node);
    },

    /**
     * The purpose of this override is to preserve certain state when setting
     * a new root node, namely whether nodes should be selected and or expanded.
     *
     * The difficulty lies in the fact that a node must be added to a TreePanel
     * to have either of those states applied, but on the other hand, setting
     * a new root node destroys the old root node and all of its children.
     *
     * Hence, we need to 'cache' the state of the existing root node before
     * replacing it with a new one.
     */
    setRootNode: function(newRootNode) {
        this.getSelectionModel().un('selectionchange', this._onSelectionChange, this);
        var oldNodeStatesCache = this._getNodeStatesCache();

        Portal.search.HierarchicalTermSelectionPanel.superclass.setRootNode.call(this, newRootNode);

        this._mergeNodeStates(oldNodeStatesCache);
        this.getSelectionModel().on('selectionchange', this._onSelectionChange, this);
    },

    _getNodeStatesCache: function() {
        var nodeStatesCache = {};

        if (this.root) {
            this.root.eachNodeRecursive(function(node) {
                nodeStatesCache[node.getUniqueId()] = {
                    selected: node.isSelected(),
                    expanded: node.isExpanded()
                };
                return true;
            });
        }

        return nodeStatesCache;
    },

    _mergeNodeStates: function(nodeStatesCache) {
        this.root.eachNodeRecursive(function(node) {
            var oldNodeState = nodeStatesCache[node.getUniqueId()];

            if (oldNodeState) {
                oldNodeState.selected ? node.select() : node.unselect();
                oldNodeState.expanded ? node.expand() : node.collapse();
            }

            return true;
        });
    }
});
