package au.org.emii.portal

import java.beans.PropertyDescriptor;
import java.lang.reflect.Method;

import grails.converters.JSON
import grails.web.JSONBuilder;

import org.hibernate.criterion.MatchMode
import org.hibernate.criterion.Restrictions
import org.springframework.beans.BeanUtils;
import org.xml.sax.SAXException

class LayerController {

    static allowedMethods = [save: "POST", update: "POST", delete: "POST"]

    def layerService
	def dataSource
    def authService

    def index = {
        redirect(action: "list", params: params)
    }

    def list = {

        def query = {

            and {
                if ( params.keyword ) {

                    or {
                        ilike( "name", "%${params.keyword}%" )
                        ilike( "title", "%${params.keyword}%" )
                        ilike( "namespace", "%${params.keyword}%" )
                    }
                }

                if ( params.serverId ) {

                    eq( "server.id", params.long( "serverId" ) )
                }
            }

            if ( params.sort ) {
                order( params.sort, params.order )
            }
            else {
                order( "server", "asc" )
                order( "title", "asc" )
            }
        }
        
        params.max = Math.min( params.max ? params.int( "max" ) : 50, 250 )
        if ( !params.offset ) params.offset = 0

        def criteria = Layer.createCriteria()
        def layers = criteria.list( query, max: params.max, offset: params.offset )
        def filters = [keyword: params.keyword, serverId: params.serverId]
        
        def model = [
            layerInstanceList: layers,
            layersShownCount: layers.size(),
            filteredLayersCount: layers.totalCount,
            filters: filters
        ]

        if ( request.xhr ) {

            // This is an ajax request
            render template: "listBody", model: model
        }
        else {

            return model
        }
    }

    def listBaseLayersAsJson = {
        def layerInstanceList = Layer.findAllByIsBaseLayerNotEqual(false)
		JSON.use("deep") {
			render layerInstanceList as JSON
        }
    }
    
	def listForMenuEdit = {
		def max = params.limit?.toInteger() ?: 50
		def offset = params.start?.toInteger() ?: 0
		
		def criteria = Layer.createCriteria()
		def layers = criteria.list(max: max, offset: offset) {
			if (params.phrase?.size() > 1) {
				add(Restrictions.ilike("title", "${params.phrase}", MatchMode.ANYWHERE))
			}
			add(Restrictions.isEmpty("layers"))
			eq 'blacklisted', false
			eq 'activeInLastScan', true
			server {
				eq 'disable', false
			}
			order("server.id")
			order("title")
		}
		
		def combinedList = _collectLayersAndServers(layers)
		render _toResponseMap(combinedList, layers.totalCount) as JSON
	}

    def showLayerByItsId = {

        def layerInstance = Layer.get( params.layerId )

        if ( layerInstance ) {

            JSON.use("deep") {
                render layerInstance as JSON
            }
        }
        else {

            def queryString = request.queryString ? "?$request.queryString" : ""
            def msg = "Layer with id '$params.layerId' does not exist. URL was: $request.forwardURI$queryString"
            log.info msg
            render text: msg, contentType: "text/html", encoding: "UTF-8", status: 500
        }
    }
    
    // Lookup a layer using the server uri and layer name 
    // (used to find any portal layer corresponding to externally entered layer details)
    
    def findLayerAsJson = {
        def criteria = Layer.createCriteria()
        
        // For the moment just use the protocol/authority portion of the server uri 
        // due to inconsistencies in the way server URI's are being used.
        // This should be unique anyway
        
        def serverUrl = new URL(params.serverUri)
        def serverUriPattern = serverUrl.getProtocol() + "://" + serverUrl.getAuthority() + '%'
        
        // split name into namespace and local name components if applicable
        
        def parts = params.name.split(":")
        def namespace, localName
        
        if (parts.length == 2) {
            namespace = parts[0]
            localName = parts[1]
        } else {
            namespace = null
            localName = params.name
        }
        
        def layerInstance = criteria.get {  
            server {
                like("uri", serverUriPattern)
            }
            if (namespace) {
                eq( "namespace", namespace)
            } else {
                isNull ("namespace")
            }         
            eq( "name", localName)
            isNull("cql")      // don't include filtered layers!
        }
            
        if (layerInstance) {
            JSON.use("deep") {
                render layerInstance as JSON
            }
        } else {
            render text: "Layer '${params.namespace}:${params.name}' does not exist", status: 404
        }
    }

    def create = {
        def layerInstance = new Layer()

        layerInstance.properties = params
        layerInstance.dataSource = "Manual"

        return [layerInstance: layerInstance]
    }

    def save = {
        def layerInstance = new Layer(params)
        if (layerInstance.save(flush: true)) {
            flash.message = "${message(code: 'default.created.message', args: [message(code: 'layer.label', default: 'Layer'), layerInstance.id])}"
            redirect(action: "list")
        }
        else {
            render(view: "create", model: [layerInstance: layerInstance])
        }
    }

    def edit = {
        def layerInstance = Layer.get(params.id)
        if (!layerInstance) {
            flash.message = "${message(code: 'default.not.found.message', args: [message(code: 'layer.label', default: 'Layer'), params.id])}"
            redirect(action: "list")
        }
        else {
            return [layerInstance: layerInstance]
        }
    }

    def update = {
        def layerInstance = Layer.get(params.id)
        if (layerInstance) {
            if (params.version) {
                def version = params.version.toLong()
                if (layerInstance.version > version) {
                    
                    layerInstance.errors.rejectValue("version", "default.optimistic.locking.failure", [message(code: 'layer.label', default: 'Layer')] as Object[], "Another user has updated this Layer while you were editing")
                    render(view: "edit", model: [layerInstance: layerInstance])
                    return
                }
            }
            layerInstance.properties = params
            if (!layerInstance.hasErrors() && layerInstance.save(flush: true)) {
                flash.message = "${message(code: 'default.updated.message', args: [message(code: 'layer.label', default: 'Layer'), layerInstance.id])}"
                redirect(action: "list", id: layerInstance.id)
            }
            else {
                render(view: "edit", model: [layerInstance: layerInstance])
            }
        }
        else {
            flash.message = "${message(code: 'default.not.found.message', args: [message(code: 'layer.label', default: 'Layer'), params.id])}"
            redirect(action: "list")
        }
    }

    def delete = {
        def layerInstance = Layer.get(params.id)
        if (layerInstance) {
            try {
				//layerInstance.onDelete()
                layerInstance.delete()
                flash.message = "${message(code: 'default.deleted.message', args: [message(code: 'layer.label', default: 'Layer'), params.id])}"
                redirect(action: "list")
            }
            catch (org.springframework.dao.DataIntegrityViolationException e) {
                flash.message = "${message(code: 'default.not.deleted.message', args: [message(code: 'layer.label', default: 'Layer'), params.id])}"
                redirect(action: "edit", id: params.id)
            }
        }
        else {
            flash.message = "${message(code: 'default.not.found.message', args: [message(code: 'layer.label', default: 'Layer'), params.id])}"
            redirect(action: "list")
        }
    }

    def saveOrUpdate = {

        try {
            // Logging output

            if ( log.debugEnabled ) {
                def layerDataPrint = JSON.parse( params.layerData as String )
                layerDataPrint.children = "[...]"
                layerDataPrint.supportedProjections = "[...]"

                log.debug "metadata:  ${params.metadata}"
                log.debug "layerData: $layerDataPrint"
            }

            // Check credentials
            try {
                _validateCredentialsAndAuthenticate params
            }
            catch(Exception e) {

                log.info "Problem validating credentials", e

                render status: 401, text: "Credentials missing or incorrect"
                return
            }
            
            // Should control be handed-off to layerService as soon as the credentials are checked?
            
            // Check metadata
            def metadata = JSON.parse( params.metadata as String )
            _validateMetadata metadata

            // Check layer data
            def layerData = params.layerData
            _validateLayerData layerData

            // Get server w/ metdata
            def server = Server.findByUri( metadata.serverUri )

            if ( !server ) throw new IllegalStateException( "Unable to find server for uri: ${metadata.serverUri}" )
            
            layerService.updateWithNewData JSON.parse( layerData as String ), server, metadata.dataSource
            
            server.lastScanDate = new Date()
            server.save( failOnError: true )
            
            render status: 200, text: "Complete (saved)"
        }
        catch (Exception e) {

            log.info "Error processing layer/saveOrUpdate request", e
            
            render status: 500, text: "Error processing request: $e"
        }
    }
    
	
	def getFormattedMetadata = {
		if (params.metaURL != null) {
			try {
				//Connect
				def con = new URL(params.metaURL).openConnection()
				def xml = new XmlSlurper().parse(con.responseCode == 200 ? con.inputStream : con.errorStream)

				//TODO: Validate schema before proceeding
				
				//Extract Abstract and resource links
				def abstractText = xml.identificationInfo.MD_DataIdentification.abstract.CharacterString.text()
				def onlineResourcesList = xml.distributionInfo.MD_Distribution.transferOptions.MD_DigitalTransferOptions.onLine.list()
				
				//TODO: transform to html in a better way. e.g. xslt
				def html = "<BR><b>Abstract</b><BR>${abstractText}<BR><BR><b>Online Resources</b><BR>"
				onlineResourcesList.each {
					def linkText = it.CI_OnlineResource.description.CharacterString.text()
					def linkUrl = it.CI_OnlineResource.linkage.URL.text()
					html += "<a href=${linkUrl} target=\"_blank\">${linkText}</a><BR>"
				}
				render text: html, contentType: "text/html", encoding: "UTF-8"
			} catch(SAXException e) {
				render text: "<BR>The metadata record is not available at this time.", contentType: "text/html", encoding: "UTF-8"
			}
		} else {
			render text: "<BR>This layer has no link to a metadata record", contentType: "text/html", encoding: "UTF-8"
		}
	}

	
    void _validateCredentialsAndAuthenticate(def params) {
        
        def suppliedPassword = params.password
        
        if ( !suppliedPassword ) throw new IllegalArgumentException( "Supplied value for password is invalid." )
        
        def configuredPassword = Config.activeInstance().wmsScannerCallbackPassword
        
        if ( !configuredPassword ) throw new IllegalStateException( "WMS Scanner password not configured in Portal app." )

        if ( configuredPassword != suppliedPassword ) throw new IllegalArgumentException( "Supplied password does not match configured password." )
    }
    
    void _validateMetadata(def metadata) {
        
        if ( !metadata ) throw new IllegalArgumentException( "Metadata must be present" )
        if ( !metadata.serverUri ) throw new IllegalArgumentException( "serverUri must be specified in the metadata" )
        if ( !metadata.dataSource ) throw new IllegalArgumentException( "dataSource must be specified in the metadata" )
    }
    
    void _validateLayerData(def layerData) {
        
        if ( !layerData ) throw new IllegalArgumentException( "LayerData must be present" )
    }

    def server = {
		def layerDescriptors = []
        def server = _getServer(params)
        if (server) {
            def criteria = Layer.createCriteria()
            layerDescriptors = criteria.list() {
                isNull 'parent'
				eq 'blacklisted', false
				eq 'activeInLastScan', true
                eq 'server.id', server.id
				join 'server'
            }
        }
        def layersToReturn = layerDescriptors
        // If just one grouping layer, bypass it
        if ( layerDescriptors.size() == 1 &&
             layerDescriptors[0].layers.size() > 0 ) 
		{
            layersToReturn = layerDescriptors[0].layers
        }
			 
		layersToReturn = _removeBlacklistedAndInactiveLayers(layersToReturn)
		
		// Evict from the Hibernate session as modifying the layers causes a Hibernate update call
		layerDescriptors*.discard()

        def result = [layerDescriptors: _convertLayersToListOfMaps(layersToReturn)]
		render result as JSON
    }
	
	def configuredbaselayers = {
		def layerIds = Config.activeInstance().baselayerMenu?.menuItems?.collect { it.layerId }
		def data = _convertLayersToListOfMaps(_findLayersAndServers(layerIds))
		render data as JSON
	}
	
	def defaultlayers = {
		def layerIds = Config.activeInstance().defaultLayers?.collect { it.id }
		def data = _convertLayersToListOfMaps(_findLayersAndServers(layerIds))
		render data as JSON
	}

    def _getServer(params) {
        if (params.server) {
            return Server.get(params.server)
        }
        return null
    }
	
	def _collectLayersAndServers(layers) {
		def items = []
		def server
		layers.each { layer ->
			server = _collectServer(server, layer.server, items)
			items.add(layer)
		}
		return items
	}
	
	def _collectServer(previous, current, items) {
		def result = previous
		if (_isServerCollectable(result, current)) {
			result = current
			items.add(result)
		}
		return result
	}
	
	def _isServerCollectable(server1, server2) {
		return server2 && (!server1 || server1 != server2)
	}
	
	def _toResponseMap(data, total) {
		return [data: data, total: total]
	}
	
	def _removeBlacklistedAndInactiveLayers(layerDescriptors) {
		def filtered = layerDescriptors.findAll { !it.blacklisted && it.activeInLastScan }
		filtered.each { layerDescriptor ->
			layerDescriptor.layers = _removeBlacklistedAndInactiveLayers(layerDescriptor.layers)
		}
		return filtered
	}
    
    def _getNamespace(qualifiedName) {
        
    }
	
	def _convertLayersToListOfMaps(layers) {
		def excludes = [
			'class',
			'metaClass',
			'dimensions',
			'metadataUrls',
			'hasMany',
			'handler',
			'belongsTo',
			'layers',
			'parent',
			'hibernateLazyInitializer'
		]
		
		def data = []
		layers.each { layer ->
			def layerData = [:]
			PropertyDescriptor[] properties = BeanUtils.getPropertyDescriptors(layer.getClass())
			for (PropertyDescriptor property : properties) {
				String name = property.getName()
				Method readMethod = property.getReadMethod()
				if (readMethod != null && !excludes.contains(name)) {
					Object value = readMethod.invoke(layer, (Object[]) null)
					layerData[name] = value
				}
			}
			data << layerData
		}
		return data
	}
	
	def _findLayersAndServers(layerIds) {
		def layers = []
		if (layerIds) {
			def criteria = Layer.createCriteria()
			layers = criteria.list {
				'in'('id', layerIds)
				join 'server'
			}
		}
		return layers
	}
}