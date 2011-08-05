
<%@ page import="au.org.emii.portal.Layer" %>
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="layout" content="main" />
        <g:set var="entityName" value="${message(code: 'layer.label', default: 'Layer')}" />
        <title><g:message code="default.list.label" args="[entityName]" /></title>
    </head>
    <body>
        <div class="nav">
            <span class="menuButton"><a class="home" href="${createLink(uri: '/')}"><g:message code="default.home.label"/></a></span>
            <span class="menuButton"><g:link class="create" action="create"><g:message code="default.new.label" args="[entityName]" /></g:link></span>
        </div>
        <div class="content">
            <h1><g:message code="default.list.label" args="[entityName]" /></h1>
            <g:if test="${flash.message}">
            <div class="message">${flash.message}</div>
            </g:if>
            <div class="list">
                <table>
                    <thead>
                        <tr>
                        
                            <g:sortableColumn property="id" title="${message(code: 'layer.id.label', default: 'Id')}" />

                            <g:sortableColumn property="name" title="${message(code: 'layer.layers.label', default: 'Layers')}" />
                            <g:sortableColumn property="name" title="${message(code: 'layer.name.label', default: 'Name')}" />
                            <g:sortableColumn property="opacity" title="${message(code: 'layer.opacity.label', default: 'Opacity')}" />
                        
                            <g:sortableColumn property="disabled" title="${message(code: 'layer.disabled.label', default: 'Disabled')}" />
                        
                            <g:sortableColumn property="description" title="${message(code: 'layer.description.label', default: 'Description')}" />
                        
                            <th><g:message code="layer.server.label" default="Server" /></th>

                            <th><g:message code="layer.server.label" default="Is Base Layer" /></th>
                        
                        
                        </tr>
                    </thead>
                    <tbody>
                    <g:each in="${layerInstanceList}" status="i" var="layerInstance">
                        <tr class="${(i % 2) == 0 ? 'odd' : 'even'}">
                        
                            <td><g:link action="show" id="${layerInstance.id}">${fieldValue(bean: layerInstance, field: "id")}</g:link></td>

                            <td>${fieldValue(bean: layerInstance, field: "layers")}</td>
                            <td>${fieldValue(bean: layerInstance, field: "name")}</td>

                            <td>${fieldValue(bean: layerInstance, field: "opacity")}</td>
                        
                            <td><g:formatBoolean boolean="${layerInstance.disabled}" /></td>
                        
                            <td>${fieldValue(bean: layerInstance, field: "description")}</td>
                        
                            <td>${fieldValue(bean: layerInstance, field: "server")}</td>
                        
                            <td>${fieldValue(bean: layerInstance, field: "isBaseLayer")}</td>

                            
                        </tr>
                    </g:each>
                    </tbody>
                </table>
            </div>
            <div class="paginateButtons">
                <g:paginate total="${layerInstanceTotal}" />
            </div>
        </div>
    </body>
</html>
