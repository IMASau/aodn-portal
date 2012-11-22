
<%--

 Copyright 2012 IMOS

 The AODN/IMOS Portal is distributed under the terms of the GNU General Public License

--%>


<%@ page import="au.org.emii.portal.Server" %>
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="layout" content="main" />
        <g:set var="entityName" value="${message(code: 'server.label', default: 'Server')}" />
        <title><g:message code="default.show.label" args="[entityName]" /></title>
    </head>
    <body>
        <div class="nav">
          <div id="logo"></div>
            <span class="menuButton"><a class="home" href="${createLink(uri: '/')}"><g:message code="default.home.label"/></a></span>
            <span class="menuButton"><g:link class="list" action="list"><g:message code="default.list.label" args="[entityName]" /></g:link></span>
            <span class="menuButton"><g:link class="create" action="create"><g:message code="default.new.label" args="[entityName]" /></g:link></span>
        </div>
        <div class="body">
            <h1><g:message code="default.show.label" args="[entityName]" /></h1>
            <g:if test="${flash.message}">
            <div class="message">${flash.message}</div>
            </g:if>
            <div class="dialog">
                <table>
                    <tbody>
                    
                        <tr class="prop">
                            <td valign="top" class="name"><g:message code="server.id.label" default="Id" /></td>
                            
                            <td valign="top" class="value">${fieldValue(bean: serverInstance, field: "id")}</td>
                            
                        </tr>
                    
                        <tr class="prop">
                            <td valign="top" class="name"><g:message code="server.uri.label" default="Uri" /></td>
                            
                            <td valign="top" class="value">${fieldValue(bean: serverInstance, field: "uri")}</td>
                            
                        </tr>
                    
                        <tr class="prop">
                            <td valign="top" class="name"><g:message code="server.shortAcron.label" default="Short Acron" /></td>
                            
                            <td valign="top" class="value">${fieldValue(bean: serverInstance, field: "shortAcron")}</td>
                            
                        </tr>
                    
                        <tr class="prop">
                            <td valign="top" class="name"><g:message code="server.type.label" default="Type" /></td>
                            
                            <td valign="top" class="value">${fieldValue(bean: serverInstance, field: "type")}</td>
                            
                        </tr>
                    
                        <tr class="prop">
                            <td valign="top" class="name"><g:message code="server.name.label" default="Name" /></td>
                            
                            <td valign="top" class="value">${fieldValue(bean: serverInstance, field: "name")}</td>
                            
                        </tr>
                    
                        <tr class="prop">
                            <td valign="top" class="name"><g:message code="server.disable.label" default="Disable" /></td>
                            
                            <td valign="top" class="value"><g:formatBoolean boolean="${serverInstance?.disable}" /></td>
                            
                        </tr>
                        
                        <tr class="prop">
                            <td valign="top" class="name"><g:message code="server.allowDiscoveries.label" default="Allow Discoveries" /></td>                            
                            <td valign="top" class="value"><g:formatBoolean boolean="${serverInstance?.allowDiscoveries}" /></td>
                            
                        </tr>
                    
                        <tr class="prop">
                            <td valign="top" class="name"><g:message code="server.comments.label" default="Comments" /></td>
                            
                            <td valign="top" class="value">${fieldValue(bean: serverInstance, field: "comments")}</td>
                            
                        </tr>
                        
                        <tr class="prop">
                            <td valign="top" class="name"><g:message code="server.opacity.label" default="Opacity" /></td>
                            
                            <td valign="top" class="value">${fieldValue(bean: serverInstance, field: "opacity")}%</td>
                            
                        </tr>
                        
                        <tr class="prop">
                            <td valign="top" class="name"><g:message code="server.imageFormat.label" default="imageFormat" /></td>
                            
                            <td valign="top" class="value">${fieldValue(bean: serverInstance, field: "imageFormat")}</td>
                            
                        </tr>                        
                        <tr class="prop">
                            <td valign="top" class="name"><g:message code="server.infoFormat.label" default="infoFormat" /></td>
                            
                            <td valign="top" class="value">${fieldValue(bean: serverInstance, field: "infoFormat")}</td>
                            
                        </tr>
                    
                        <tr class="prop">
                            <td valign="top" class="name"><g:message code="server.lastScanDate.label" default="Last Scan Date" /></td>
                            
                            <td valign="top" class="value"><g:formatDate date="${serverInstance?.lastScanDate}" /></td>
                            
                        </tr>
                    
                        <tr class="prop">
                            <td valign="top" class="name"><g:message code="server.scanFrequency.label" default="Scan Frequency" /></td>
                            
                            <td valign="top" class="value">${fieldValue(bean: serverInstance, field: "scanFrequency")}</td>
                            
                        </tr>
                    
                    </tbody>
                </table>
            </div>
            <div class="buttons">
                <g:form>
                    <g:hiddenField name="id" value="${serverInstance?.id}" />
                    <span class="button"><g:actionSubmit class="edit" action="edit" value="${message(code: 'default.button.edit.label', default: 'Edit')}" /></span>
                    <span class="button"><g:actionSubmit class="delete" action="delete" value="${message(code: 'default.button.delete.label', default: 'Delete')}" onclick="return confirm('${message(code: 'default.button.delete.confirm.message', default: 'Are you sure?')}');" /></span>
                </g:form>
            </div>
        </div>
    </body>
</html>
