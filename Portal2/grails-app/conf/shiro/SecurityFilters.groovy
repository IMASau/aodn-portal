package shiro

/**
 * Generated by the Shiro plugin. This filters class protects all URLs
 * via access control by convention.
 */
class SecurityFilters {
    def filters = {
        
        homeAccess(controller: "home", action: "index|config") {
            before = {
            
                logRequest("homeAccess", controllerName, actionName)
                
                // Allow all access
                request.accessAllowed = true
            }
        }
        homeAccess(controller: "splash", action: "*") {
            before = {
            
                logRequest("splashAccess", controllerName, actionName)
                
                // Allow all access
                request.accessAllowed = true
            }
        }
               
        configAccess(controller: "config", action: "viewport") {
            before = {
                
                logRequest("configAccess", controllerName, actionName)
                
                // Allow all access
                request.accessAllowed = true
            }
        }

        depthAccess(controller: "depth", action: "index") {
            before = {
                
                logRequest("depthAccess", controllerName, actionName)

                // Allow all access
                request.accessAllowed = true
            }
        }

        snapshotAccess(controller: "snapshot", action: "*") {
            before = {
                
                logRequest("snapshotAccess", controllerName, actionName)
                
                // Allow all access
                request.accessAllowed = true
            }
        }

        serverAccess(controller: "server", action: "listAllowDiscoveriesAsJson") {
            before = {
                
                logRequest("serverAccess", controllerName, actionName)
                
                // Allow all access
                request.accessAllowed = true
            }
        }
        
        layerAccess(controller: "layer", action: "listBaseLayersAsJson|showLayerByItsId|saveOrUpdate|server|configuredbaselayers|defaultlayers") {
            before = {
                
                logRequest("layerAccess", controllerName, actionName)
                
                // Allow all access
                request.accessAllowed = true
            }
        }
        
        menuAccess(controller: "menu", action: "json") {
            before = {

                logRequest("menuAccess", controllerName, actionName)

                // Allow all access
                request.accessAllowed = true
            }
        }
        
        proxyAccess(controller: "proxy", action: "index|cache") {
            before = {
                
                logRequest("proxyAccess", controllerName, actionName)
                
                // Allow all access
                request.accessAllowed = true
            }
        }

        downloadAccess(controller: "download", action: "downloadFromCart") {
            before = {
                
                logRequest("downloadAccess", controllerName, actionName)
                
                // Allow all access
                request.accessAllowed = true
            }
        }
        
        authAccess(controller: "auth", action: "login|register|createUser|forgotPassword") {
            before = {
                
                logRequest("authAccess", controllerName, actionName)
                
                // Allow all access
                request.accessAllowed = true
            }
        }
      
        all(uri: "/**") {
            before = {
                
                // Check if request has been allowed by another filter
                if (request.accessAllowed) return true            
                
                logRequest("all", controllerName, actionName)
                
                // Ignore direct views (e.g. the default main index page).
                if (!controllerName) return true
                                
                // Access control by convention.
                accessControl(auth: false) // "auth: false" means it will accept remembered users as well as those who logged-in in this session
            }
        }
    }
    
    private void logRequest(String filterName, String controllerName, String actionName) {
        
        log.debug "Request matches ${filterName} filter. Request: controllerName = '${controllerName}', actionName = '${actionName}'."
    }
}