package au.org.emii.portal

import grails.converters.JSON
import org.codehaus.groovy.grails.web.json.*
import java.text.DateFormat
import java.util.zip.*
import java.io.ByteArrayInputStream

class DownloadController {

    private static final int BufferSize = 4096 // 4kB
    private static final String CookieName = "ys-AggregationItems"
    private static final String CookieDataPrefix = "s:"
    
    private static final int MinFileExtensionLength = 2
    private static final int MaxFileExtensionLength = 4
    
    def downloadFromCart = {
                
        def startTime = System.currentTimeMillis()
        def config = Config.activeInstance()
        def todaysDate = DateFormat.getDateInstance(DateFormat.LONG, request.getLocale()).format(new Date())
        def filename = String.format(config.downloadCartFilename, todaysDate)
        def reportText = """\
============================================
Download cart report (${todaysDate})
============================================
"""
        
        // Read data from cookie
        def jsonArray
        def jsonData = "[]"
        log.debug "Cookies: ${ request.cookies.size() }"
        request.cookies.find{
                it.name == CookieName
            }.each{

                log.debug "Cookie: ${ it.value.decodeURL() }"
            
                jsonData = it.value.decodeURL()

                jsonData = jsonData[CookieDataPrefix.length()..-1] // Trim data prefix

                log.debug jsonData
            }
        jsonArray = JSON.parse(jsonData)
        
        log.debug "jsonArray: ${jsonArray.length()} items"
        log.debug "jsonArray: ${jsonArray}"
        
        // Prepare response stream and create zip stream
        response.setHeader("Content-Disposition", "attachment; filename=${filename}")
        response.contentType = "application/octet-stream"
        ZipOutputStream zipOut = new ZipOutputStream(response.outputStream)
        
        def numberOfRowsProcessed = 0
        def numberOfFilesAdded = 0
        def bytesAddedForThisFile = 0
        def totalSizeBeforeCompression = 0
        jsonArray.each({
            
            // Write to report
            reportText += """
--[ #${numberOfRowsProcessed + 1 /* adjust for 0-based index*/} ]-----------------------------
Title:                ${it.title}
URL:                  ${it.href}
Type:                 ${it.type}
Filename in zip file: ${it.title}.${extensionFromUrlAndType(it.href, it.type)}
                      ** File extension based on URL where possible, otherwise based on provided type information.
Result:               """
                
            if ( numberOfFilesAdded >= config.downloadCartMaxNumFiles ) {

                reportText += "Unable to add file, maximum number of files allowed reached (${numberOfFilesAdded}/${config.downloadCartMaxNumFiles} files)"
            }
            else if ( totalSizeBeforeCompression >= config.downloadCartMaxFileSize ) {
                
                reportText += "Unable to add file, maximum size of files allowed reached (${totalSizeBeforeCompression}/${config.downloadCartMaxFileSize} Bytes)"
            }
            else {
                bytesAddedForThisFile = addToZip( zipOut, it )
                
                if (bytesAddedForThisFile > 0) {

                    numberOfFilesAdded++
                    reportText += "File added"
                    totalSizeBeforeCompression += bytesAddedForThisFile
                }
                else {
                    reportText += "Unknown error adding file"
                }
            }

            reportText += "\n"
                
            numberOfRowsProcessed++
        })
                        
        
        reportText += """
============================================
Total size before compression: ${totalSizeBeforeCompression} Bytes
Number of files included: ${numberOfFilesAdded}/${numberOfRowsProcessed}
Time taken: ${(System.currentTimeMillis() - startTime) / 1000} seconds
============================================"""
        
        // Add report to zip file
        def reportEntry = new ZipEntry( "download report.txt" )
        byte[] reportData = reportText.getBytes( "UTF-8" )
        
        zipOut.putNextEntry reportEntry
        zipOut.write reportData, 0, reportData.length
        zipOut.closeEntry()
        
        // Close file and finish response
        zipOut.close()
        response.outputStream.flush()
    }
    
    private long addToZip(ZipOutputStream zipOut, JSONObject info) {
        log.debug "-" * 48
        log.debug "Adding '${info.title}' from ${info.href}"

        def buffer = new byte[ BufferSize ]
                
        // Add to zip
        def bytesRead
        long totalBytesRead = 0
        def dataFromUrl
        try {
            def requestUrl = info.href.toURL()

            log.debug "requestUrl: ${requestUrl}"
            log.debug "info.type: ${info.type}"

            if(info.type.equals("text/html"))
            {
                String content = "[InternetShortcut]\r\n";
                content += "URL=" + requestUrl + "\r\n"
                dataFromUrl = new ByteArrayInputStream(content.getBytes())
            }
            else
            {
                dataFromUrl = requestUrl.newInputStream()
            }

            def newEntry = new ZipEntry( "${info.title}.${extensionFromUrlAndType( info.href, info.type )}" )
            zipOut.putNextEntry newEntry
            
            while ((bytesRead = dataFromUrl.read( buffer )) != -1) {

                zipOut.write buffer, 0, bytesRead
                totalBytesRead += bytesRead
            }

            //always, always close your streams :)
            dataFromUrl.close()

            zipOut.closeEntry()
        }
        catch(IOException ioe) {
            log.debug "ioe: $ioe"
        }
        
        log.debug "totalBytesRead: $totalBytesRead"
        
        if ( dataFromUrl ) {
            dataFromUrl.close()
        }
        
        return totalBytesRead
    }
    
    private String extensionFromUrlAndType(String url, String type) {
        //short cutting this -- if it's a URL, then this will generate a .url file instead
        //of downbloading the whole thing.

        // Check for file extensions on URL
       
        for (i in MinFileExtensionLength..MaxFileExtensionLength) {
            
            int startOfExtensionIndex = (-1 * i)
            int endOfExtensionIndex = -1
            int previousCharIndex = startOfExtensionIndex - 1

            def urlExtension = null

            if ( url[ previousCharIndex ] == "." ) {
                urlExtension = url[startOfExtensionIndex..endOfExtensionIndex]
            }

            if(urlExtension != null)
            {
                if(!urlExtension.equals("html"))
                    return urlExtension
                else
                    return "url"

            }
        }
        
        // Use mapping to try and guess extension
        
        def value = mapping()[type]
                
        return value ? value : ""
    }
    
    private JSONObject _mapping;
    private JSONObject mapping() {
        
        if ( _mapping == null ) {
            
            _mapping = JSON.parse( Config.activeInstance().downloadCartMimeTypeToExtensionMapping )
        }
        
        return _mapping
    }
}