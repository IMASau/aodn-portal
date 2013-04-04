package au.org.emii.portal.scanner

import grails.converters.JSON

/**
 * Created with IntelliJ IDEA.
 * User: pmak
 * Date: 26/03/13
 * Time: 12:31 PM
 * To change this template use File | Settings | File Templates.
 */
class ScannerService {
    def grailsApplication
    def scannerBaseUrl

    def _optionalSlash( url ) { // Todo - DN: Change to _ensureTrailingSlash

        return url[-1..-1] != "/" ? "/" : ""
    }

    def portalBaseURL(){
        def portalBaseUrl = grailsApplication.config.grails.serverURL
        def slash = _optionalSlash( portalBaseUrl )
        return "${portalBaseUrl}${slash}"
    }

    def saveOrUpdateCallbackUrl(){
        return ""
    }

    def getStatus() {
        def callbackUrl = URLEncoder.encode( saveOrUpdateCallbackUrl() )

        def url = "${scanJobUrl()}list?callbackUrl=$callbackUrl".toURL()

        def content = callService(url)

        return JSON.parse( content )
    }

    def getScannerBaseUrl(){
        //to be overridden by subclass
    }

    def scannerURL(){
        if(scannerBaseUrl == null)
            scannerBaseUrl = getScannerBaseUrl()

        def slash = _optionalSlash( scannerBaseUrl )
        return "${scannerBaseUrl}${slash}"
    }

    def scanJobUrl() {
        return "${scannerURL()}scanJob/"
    }

    def executeCommand( conn ) {

        def response = conn.content.text // Executes command

        if ( response.toLowerCase().contains( "<html" ) ) {

            response = "HTML response (Code: ${ conn.responseCode })"
        }


        return response
    }

    def callService(address){
        def url
        def conn

        url = address.toURL()
        conn = url.openConnection()
        conn.connect()

        return executeCommand( conn )
    }

}
