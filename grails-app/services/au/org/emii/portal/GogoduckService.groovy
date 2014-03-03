package au.org.emii.portal

import groovyx.net.http.HTTPBuilder
import groovyx.net.http.HttpResponseException

class GogoduckService {

    static transactional = true

    def grailsApplication

    void registerJob(jobParameters) throws HttpResponseException {

        def registerJobUrl = grailsApplication.config.gogoduck.url + '/job/'

        new HTTPBuilder(registerJobUrl).post(
            [body: jobParameters],
            successHandler
        )
    }

    def successHandler = { response, reader ->

        if (log.isDebugEnabled()) {
            log.debug "GoGoDuck response: ${response.statusLine}"
            log.debug 'Response data: -----'
            reader.eachLine { log.debug it }
            log.debug '\n--------------------'
        }
    }
}
