package au.org.emii.portal

import org.codehaus.groovy.grails.web.json.JSONElement

class LayerService {

    static transactional = true

    void updateWithNewData(JSONElement layerAsJson, Server server, String dataSource) {

        try {

            def existingLayers = [:]

            def updatedLayerPaths = [] as SortedSet
            def addedLayerPaths = []

            // Traverse existing layers
            // - Disable layer
            // - Store layer in map for later update

            def matchingLayers = Layer.findAllWhere(
                server: server,
                parent: null,
                dataSource: dataSource
            )

            def rootLayer = matchingLayers?.getAt( 0 ) // Get first element or null

            log.info "== Find Root Layer =="
            log.info "With server: $server"
            log.info "With parent: null"
            log.info "With source: $dataSource"
            log.info "Found ${matchingLayers.size()} matching Layer(s)"
            log.info "Using: $rootLayer"
            log.debug "====================="

            if ( rootLayer ) {

                def allLayersInServer = Layer.findAllByServerAndDataSource( server, dataSource )

                log.debug "allLayersInServer: ${ allLayersInServer.size() }"

                allLayersInServer.each {

                    def uid = _uniquePathIdentifier( it, it.parent )

                    log.debug "Disabling existing layer and storing for later ($uid)"

                    // Check for duplicates
                    if ( existingLayers[ uid ] ) {

                        log.warn "*********************************"
                        log.warn "*** Duplicate name + title id: $uid"
                        log.warn "*********************************"
                    }

                    it.activeInLastScan = false
                    existingLayers[ uid ] = it
                }
            }

            // Traverse incoming JSON and create or update layers (update if they are in existingLayers[])
            def newLayer = _traverseJsonLayerTree( layerAsJson, null, {
                newData, parent ->

                def uniquePath = _uniquePathIdentifier( newData, parent )
                def layerToUpdate = existingLayers[ uniquePath ]

                if ( layerToUpdate ) {
                    
                    log.debug "Found existing layer with details: '$uniquePath'"

                    updatedLayerPaths << uniquePath

                    def currentParent = layerToUpdate.parent
                    
                    if ( currentParent && ( currentParent != parent ) ) {
                            
                        layerToUpdate.parent = null
                    }

                    layerToUpdate.dimensions*.delete()
                }
                else {

                    log.debug "Could not find existing layer with details: '$uniquePath'. Creating new..."

                    addedLayerPaths << uniquePath

                    // Doesn't exist, create
                    layerToUpdate = new Layer()
                    layerToUpdate.server = server
                }
                   
                log.debug "Applying new values to layer: $newData"

                // Add as child of parent
                if ( parent ) layerToUpdate.parent = parent //parent.addToLayers layerToUpdate
                
                // Move data over
                layerToUpdate.title      = newData.title
                layerToUpdate.queryable  = newData.queryable
                layerToUpdate.bboxMinX   = newData.bboxMinX
                layerToUpdate.bboxMinY   = newData.bboxMinY
                layerToUpdate.bboxMaxX   = newData.bboxMaxX
                layerToUpdate.bboxMaxY   = newData.bboxMaxY
                layerToUpdate.projection = newData.bboxProjection

                _attachNameInfo      layerToUpdate, newData
                _attachAbstractText  layerToUpdate, newData
                _attachStyleInfo     layerToUpdate, newData
                _attachMetadataUrls  layerToUpdate, newData
                _attachWmsDimensions layerToUpdate, newData

                // Scan info
                layerToUpdate.dataSource = dataSource
                layerToUpdate.activeInLastScan = true
                layerToUpdate.lastUpdated = new Date()

                layerToUpdate.layerHierarchyPath = uniquePath

				// Need to explicitly save, since saves no longer cascade to children (since fix for #1761).
				layerToUpdate.save(failOnError: true)

                return layerToUpdate
            })

            // Summary of changes
            def existingLayerPaths = new TreeSet( existingLayers.keySet() )
            def layersLeftInactivePaths = existingLayerPaths.minus( updatedLayerPaths )

            log.info "== Updating Layers finished for server: $server ==========="
            log.info "# Layers updated: ${ updatedLayerPaths.size() }"
            updatedLayerPaths.each{ log.debug it }

            log.info "# Layers added: ${ addedLayerPaths.size() }"
            addedLayerPaths.each{ log.debug it }

            log.info "# Layers made inactive: ${ layersLeftInactivePaths.size() }"
            layersLeftInactivePaths.each{ log.debug it }

            log.info "==========================================================="
        }
        catch ( Exception e ) {

            throw new RuntimeException( "Failure in updateWithNewData()", e )
        }
    }

    void _traverseLayerTree(Layer layer, Closure layerProcess) {

        layerProcess.call( layer )

        layer.layers.each {

            _traverseLayerTree it, layerProcess
        }
    }

    def _traverseJsonLayerTree(JSONElement layerAsJson, Layer parent, Closure layerProcess) {

        def newLayer = layerProcess.call( layerAsJson, parent )

        layerAsJson.children.each {

            _traverseJsonLayerTree(
                    it as JSONElement,
                    newLayer as Layer,
                    layerProcess
            )
        }

        return newLayer
    }
    
    def _uniquePathIdentifier( layer, parent ) {

        def namePart
        
        if ( layer.name ) {
        
            namePart = layer.namespace ? "${layer.namespace}:${layer.name}" : layer.name
        }
        else {
            
            namePart = "<no name>"
        }
        
        def titlePart = layer.title ?: "<no title>"
        def parentPart = parent ? _uniquePathIdentifier( parent, parent.parent ) + " // " : ""

        return "$parentPart$namePart -- $titlePart".toString()
    }

    // More helpers

    def _attachNameInfo( layer, newData ) {

        def newName = newData.name

        if ( !newName ) return

        def hasNamespace = newName.contains( ":" )

        if ( !hasNamespace ) {

            layer.name = newName
        }
        else {

            def separatorIdx = newName.lastIndexOf( ":" )

            layer.name = newName[ separatorIdx + 1 .. -1 ]
            layer.namespace = newName[ 0 .. separatorIdx - 1 ]
        }
    }

    def _attachAbstractText( layer, newData ) {

        // Process abstractText value
        def abstractVal = newData.abstractText ?: ""

        if ( abstractVal.length() > 455 ) { // 455 is current max length of this field
            abstractVal = abstractVal[0..451] + "..."
        }

        layer.abstractTrimmed = abstractVal
    }

    def _attachStyleInfo( layer, newData ) {

        if ( !newData.styles ) return

        def names = newData.styles*.name

        layer.styles = names.join( "," )
    }

    def _attachMetadataUrls( layer, newData ) {

        layer.metadataUrls*.delete()
        layer.metadataUrls.clear()

        newData.metadataUrls.each {

            def metadataUrl = new MetadataUrl()

            metadataUrl.format = it.format
            metadataUrl.type = it.type
            metadataUrl.onlineResource.type = it.onlineResource.type
            metadataUrl.onlineResource.href = it.onlineResource.href

            layer.metadataUrls << metadataUrl
        }
    }

    def _attachWmsDimensions( layer, newData ) {

        def dimensions = []

        newData.dimensions?.each {

            WMSDimension dim = new WMSDimension()

            dim.name = it.name
            dim.units = it.units
            dim.unitSymbol = it.unitSymbol
            dim.defaultValue = it.defaultValue
            dim.hasMultipleValues = it.hasMultipleValues
            dim.hasNearestValue = it.hasNearestValue
            dim.hasCurrent = it.hasCurrent
            dim.extent = it.extent

            dim.save()
            dimensions.add dim
        }

        layer.dimensions = dimensions
    }
}