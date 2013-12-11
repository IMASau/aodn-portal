/*
 * Copyright 2013 IMOS
 *
 * The AODN/IMOS Portal is distributed under the terms of the GNU General Public License
 *
 */

package au.org.emii.portal

import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream

class BulkDownloadService {

    static scope = "request"

    static final int BUFFER_SIZE = 4096 // Bytes
    static final def FILENAME_FROM_URL_REGEX = ~"(?:\\w*://).*/([\\w_-]*)(\\.[^&?/#]+)?"

    def urlList
    def zipStream
    def report
    def usedFilenames = [:]

    void generateArchiveOfFiles(urlList, outputStream, locale) {

        this.urlList = urlList

        report = new DownloadReport(locale)

        _createZipStream(outputStream)

        _writeFilesToStream()

        _closeStream()
    }

    def _createZipStream = { outputStream ->

        zipStream = new ZipOutputStream(outputStream)
        zipStream.level = ZipOutputStream.STORED
    }

    def _writeFilesToStream = {

        urlList.each {
            _addFileEntry(it)
        }

        _addDownloadReportToArchive()
    }

    def _closeStream = {

        zipStream.close()
    }

    def _addFileEntry = { url ->

        log.debug "Adding entry for file from URL: '$url'"

        def filenameToUse = _uniqueFilenameForUrl(url)
        def streamFromUrl

        try {
            streamFromUrl = url.toURL().newInputStream()

            zipStream.putNextEntry new ZipEntry(filenameToUse)

            def bytesCopied = _copyStreamData(streamFromUrl, zipStream)

            report.addSuccessfulFileEntry url, filenameToUse, bytesCopied
        }
        catch (Exception e) {

            log.info "Error adding file to download archive. URL: '$url'", e

            if (!streamFromUrl) {
                def filenameInArchive = filenameToUse + '.failed'

                zipStream.putNextEntry new ZipEntry(filenameInArchive)
                report.addFailedFileEntry url, filenameInArchive, "Unable to download data from: '$url'"
            }
            else {
                report.addFailedFileEntry url, filenameToUse, "Unknown error adding file"
            }
        }
        finally {

            streamFromUrl?.close()
            zipStream.closeEntry()
        }
    }

    def _uniqueFilenameForUrl = { url ->

        def (filename, extension) = _filenamePartsFromUrl(url)

        log.debug "filename: $filename -- extension: $extension"

        def currentCount = usedFilenames[filename]

        // First usage of this filename
        if (!currentCount) {
            usedFilenames[filename] = 1

            return filename + extension
        }

        // Subsequent usage of this filename
        currentCount++
        usedFilenames[filename] = currentCount

        return "$filename($currentCount)$extension"
    }

    def _filenamePartsFromUrl = { url ->

        def matches = url =~ FILENAME_FROM_URL_REGEX

        return [
            matches[0][1], // Filename
            matches[0][2] ?: "" // Extension
        ]
    }

    static def _copyStreamData = { inStream, outputStream ->

        def buffer = new byte[BUFFER_SIZE]
        def bytesRead
        def totalBytesRead = 0

        while ((bytesRead = inStream.read(buffer)) != -1) {
            outputStream.write buffer, 0, bytesRead
            totalBytesRead += bytesRead
        }

        return totalBytesRead
    }

    def _addDownloadReportToArchive = { ->

        def reportEntry = new ZipEntry("download_report.txt")
        def bytes = report.text.bytes

        zipStream.putNextEntry reportEntry
        zipStream.write bytes, 0, bytes.length
        zipStream.closeEntry()
    }
}
