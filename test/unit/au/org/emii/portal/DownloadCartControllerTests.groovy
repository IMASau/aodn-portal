package au.org.emii.portal

import grails.converters.JSON
import grails.test.ControllerUnitTestCase
import org.apache.commons.codec.net.URLCodec

class DownloadCartControllerTests extends ControllerUnitTestCase {

    protected void setUp() {

        super.setUp()
    }

    protected void tearDown() {

        super.tearDown()
    }

    void testAdd_NewEntries_EntriesAdded() {

        def uniqueEntriesString  = """\
            {
                "title":"NRSNSI Mooring diagram - surface",
                "href":"http://imosmest.aodn.org.au:80/geonetwork/srv/en/file.disclaimer?id=8060&fname=NRSNSI_surface_revA.pdf&access=private",
                "type":"application/pdf",
                "protocol":"WWW:DOWNLOAD-1.0-http--downloadother"
            },
            {
                "title":"NRSNSI Mooring diagram - sub-surface",
                "type":"application/pdf",
                "href":"http://imosmest.aodn.org.au:80/geonetwork/srv/en/file.disclaimer?id=8060&fname=NRSNSI_subsurface_revA.pdf&access=private",
                "protocol":"WWW:DOWNLOAD-1.0-http--downloadother"
            }\
        """

        def entriesToTryToAdd = """\
        [
            $uniqueEntriesString,
            {
                "title":"NRSNSI Mooring diagram - sub-surface",
                "href":"http://imosmest.aodn.org.au:80/geonetwork/srv/en/file.disclaimer?id=8060&fname=NRSNSI_subsurface_revA.pdf&access=private",
                "type":"application/pdf",
                "protocol":"WWW:DOWNLOAD-1.0-http--downloadother"
            }
        ]"""

        def expectedEntries = """\
        [
            $uniqueEntriesString
        ]"""

        def expectedSessionValue = [] as Set
        expectedSessionValue.addAll JSON.parse( expectedEntries ).toArray()

        // Reset cart
        mockRequest.session.downloadCart = []

        // Add first entries
        controller.params.newEntries = entriesToTryToAdd
        controller.add()

        // Verify result
        assertEquals expectedSessionValue, mockRequest.session.downloadCart
        assertEquals "2", mockResponse.contentAsString
    }

    void testAdd_NoEntries_ErrorReturned() {

        controller.add()

        assertEquals "No items specified to add", mockResponse.contentAsString
        // assertEquals 500, mockResponse.status // There is a bug in Grails testing code where response is always 200
    }

    void testGetSize() {

        def newEntries = """[{"a":"b"}, {"c":"d"}, {"e":"f"}]"""

        mockRequest.session.downloadCart = JSON.parse( newEntries ).toArray() as Set

        controller.getSize()

        assertEquals "3", mockResponse.contentAsString
    }

    void testClear() {

        mockRequest.session.downloadCart = ["sone thing", "and another"] as Set

        controller.clear()

        assertEquals( [] as Set, mockRequest.session.downloadCart )
        assertEquals "0", mockResponse.contentAsString
    }

    void testDownload_ItemsInCart() {

        loadCodec URLCodec

        def cartContents = [[href: "http://example.com/file1.txt", title:"File One"],[href:"http://example.com/file3.jpeg", title:"File Three"],[href:"http://example.com/file2.gif", title:"File Too"]] as Set

        controller.bulkDownloadService = [
                generateArchiveOfFiles: {
                    jsonArray, outputStream, locale ->

                    assertEquals cartContents, jsonArray
                    assertEquals mockResponse.outputStream, outputStream
                },
                getArchiveFilename: {
                    locale ->

                    return "filename.zip"
                }
        ]

        // Set up mock request
        mockRequest.session.downloadCart = cartContents

        controller.download()

        // Check response properties
        assertEquals "Content disposition header", "attachment; filename=filename.zip", mockResponse.getHeader( "Content-Disposition" )
        assertEquals "Content Type", "application/octet-stream", mockResponse.getContentType()
    }

    void testDownload_EmptyCart() {

        mockRequest.session.downloadCart = []

        controller.download()

        assertEquals "home", controller.redirectArgs.controller
        assertEquals "No data in cart to download", controller.flash.message
    }

    void testGetCartContents() {

        def cartEntries = """
                             [
                                 { "rec_uuid":"2", val: "A" },
                                 { "rec_uuid":"1", val: "B" },
                                 { "rec_uuid":"3", val: "C" },
                                 { "rec_uuid":"2", val: "D" },
                                 { "rec_uuid":"3", val: "E" },
                             ]""".stripIndent()

        mockRequest.session.downloadCart = JSON.parse( cartEntries ).toArray() as Set

        // Make the call
        controller.getCartContents()

        def result = JSON.parse( mockResponse.contentAsString )

        assert 3, result.size()

        println "result: $result"

        def rec1 = result.'1'
        assertNotNull rec1
        assertEquals 1, rec1.size()
        assertEquals "B", rec1.collect( { it.val } ).join(",")

        def rec2 = result.'2'
        assertNotNull rec2
        assertEquals 2, rec2.size()
        assertEquals "A,D", rec2.collect( { it.val } ).join(",")

        def rec3 = result.'3'
        assertNotNull rec3
        assertEquals 2, rec3.size()
        assertEquals "C,E", rec3.collect( { it.val } ).join(",")
    }
}