package au.org.emii.portal

import grails.converters.JSON

class WmsScannerController {

    def layerApiPath = "/layer/saveOrUpdate"
    
    def controls = {
        
        def apiUrl = Config.activeInstance().wmsScannerBaseUrl + "scanJob/"
        def callbackUrl = URLEncoder.encode( Config.activeInstance().applicationBaseUrl + layerApiPath )
        def scanJobList
        
        def url
        def conn
        
        try {
            url = "${apiUrl}list?callbackUrl=$callbackUrl".toURL()
            conn = url.openConnection()
            conn.connect()
            
            scanJobList = JSON.parse( conn.content.text ) // Makes the call
        }
        catch (Exception e) {
            
            setFlashMessage e, url, conn
            scanJobList = [] // Empty list
        }        
        
        // Status text
        def statusText = [(0): "Running", (-1): "Running<br>(with&nbsp;errors)", (-2): "Stopped<br>(too&nbsp;many&nbsp;errors)"]
        
        return [configInstance: Config.activeInstance(),
                scanJobList: scanJobList,
                statusText: statusText,
                serversToList: Server.findAllByTypeInList(["WMS-1.1.1", "WMS-1.3.0", "NCWMS-1.1.1", "NCWMS-1.3.0"], [sort: "name"])] // Todo DN - put WMS versions list in config
    }
    
    def callDeleteById = {
        
        def apiUrl = Config.activeInstance().wmsScannerBaseUrl + "scanJob/"
        def callbackUrl = URLEncoder.encode( Config.activeInstance().applicationBaseUrl + layerApiPath )
        def address = "${apiUrl}deleteById?id=${params.id}&callbackUrl=$callbackUrl"
        
        def url
        def conn
        
        try {
            url = address.toURL()
            conn = url.openConnection()
            conn.connect()
            
            def response = conn.content.text // Executes command
            
            setFlashMessage response
        }
        catch (Exception e) {
            
            setFlashMessage e, url, conn
        }        
        
        redirect(action: controls)
    }
    
    def callRegister = {
        
        def apiUrl = Config.activeInstance().wmsScannerBaseUrl + "scanJob/"

        def url
        def conn
        
        try {
            Server server = Server.get(params.id)
        
            def typeVal = server.type.replace( "NCWMS-", "" ).replace( "WMS-", "" )
            
            def jobName     = URLEncoder.encode( "Server scan for '${server.name}'" )
            def jobDesc     = URLEncoder.encode( "Created by Portal, ${new Date()}" )
            def jobType     = "WMS"
            def wmsVersion  = URLEncoder.encode( typeVal )
            def uri         = URLEncoder.encode( server.uri )
            def callbackUrl = URLEncoder.encode( Config.activeInstance().applicationBaseUrl + layerApiPath )
            def scanFrequency = server.scanFrequency
            
            // Perform action
            def address = "${apiUrl}register?jobName=$jobName&jobDescription=$jobDesc&jobType=$jobType&wmsVersion=$wmsVersion&uri=$uri&callbackUrl=$callbackUrl&scanFrequency=$scanFrequency"
        
            url = address.toURL()   
            conn = url.openConnection()
            conn.connect()
            
            def response = conn.content.text // Executes command
            
            setFlashMessage response
        }
        catch (Exception e) {
            
            setFlashMessage e, url, conn
        }
        
        redirect(action: controls)
    }
    
    private void setFlashMessage(String response) {
        
        flash.message = "Response: ${response}"
    }
    
    private void setFlashMessage(e, commandUrl, connection) {
        
        def msg = "Exception: ${ e.toString() }"
        
        if ( connection?.errorStream ) {

            Reader reader = new BufferedReader( new InputStreamReader( connection.errorStream ) )
            def currentLine

            msg += "<br />Response: "
            
            while ( ( currentLine = reader.readLine() ) != null ) {

                msg += "<br /><b>$currentLine</b>"
            }
        }
        
        if ( flash.message?.trim() ) {
            
            flash.message += "<hr>$msg"
        }
        else {
            flash.message = msg
        }
    }
}