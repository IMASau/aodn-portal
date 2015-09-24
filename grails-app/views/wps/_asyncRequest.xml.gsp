<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<wps:Execute service="WPS" version="1.0.0"
  xmlns:wps="http://www.opengis.net/wps/1.0.0" xmlns:ows="http://www.opengis.net/ows/1.1"
  xmlns:ogc="http://www.opengis.net/ogc" xmlns:xlink="http://www.w3.org/1999/xlink"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.opengis.net/wps/1.0.0 http://schemas.opengis.net/wps/1.0.0/wpsExecute_request.xsd">


  <ows:Identifier>gs:NetcdfOutput</ows:Identifier>

  <wps:DataInputs>
    <g:each in="${jobParams}" var="id, value">

      <wps:Input>
        <ows:Identifier>${id}</ows:Identifier>
        <wps:Data>
          <wps:LiteralData>${value}</wps:LiteralData>
        </wps:Data>
      </wps:Input>

    </g:each>
  </wps:DataInputs>

  <wps:ResponseForm>
    <wps:ResponseDocument storeExecuteResponse="true"
      lineage="false" status="true">
      <wps:Output asReference="true" mimeType="application/zip">
        <ows:Identifier>result</ows:Identifier>
      </wps:Output>
    </wps:ResponseDocument>
  </wps:ResponseForm>

</wps:Execute>
