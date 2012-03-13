def appName = grails.util.Metadata.current.'app.name'

environments {

    production {

    }

    development {
        println("in WA development environment")

        //grails.resources.debug = true
        grails.serverURL = "http://localhost:8000/${appName}"
        spatialsearch.url = "http://localhost:8090/spatialsearch/search/index"

        grails {
            mail {
                authenticationFromEmailAddress = "info@aodn.org.au"

                host = "localhost"
                port = 25
                username = "info@aodn.org.au"
                props = ["mail.smtp.auth":"false"]
            }
        }

        dataSource {
            //dbCreate = "update"
            driverClassName = "org.postgresql.Driver"
            url = "jdbc:postgresql://localhost:5432/localTest"
            username = "postgres"
            password = ""

            // logSql = true
            testOnBorrow = true
            validationQuery = "SELECT 1"
        }
    }

    test{

    }




}