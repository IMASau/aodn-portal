AODN Open Geospatial Portal
===========================

[![Build Status](https://travis-ci.org/aodn/aodn-portal.png?branch=master)](https://travis-ci.org/aodn/aodn-portal)

The AODN open geospatial portal is a [Grails](http://grails.org/) application for finding, visualising, and downloading geospatial data.
The application integrates with the [GeoNetwork](http://geonetwork-opensource.org/) metadata catalog and [OGC Web Map Services](http://www.opengeospatial.org/standards/wms).

You can view the portal in action at [IMOS](http://imos.aodn.org.au), which always runs the latest version of the code.

The IMOS Portal publishes the [IMOS data collection](https://imos.aodn.org.au/data_collections.html).

## Contact
Please post any questions in our [forum](http://portalhelp.aodn.org.au/Portal2_help/?q=forum).

## Features

* Faceted search for easy navigation of datasets.
* Configurable themes and splash page.
* Filter data before download.
* Subset and aggregate multiple datasets into a single file for download.
* Advanced spatial search that ensures results have features in the region of interest.  Not just a bounding box intersection.

## Quick Navigation

* [Get Portal](#getting-your-hands-on-portal)
* [Configuration](#configuring-portal)
* [How Do I Drive This Thing?](#getting-started-how-do-i-drive-this-thing)

### Getting Your Hands on Portal

Firstly we welcome contributions so please feel free to fork the project, address any issues or add features and submit
a pull request.

* [Building From Source](#building-from-source)
* [Can I Get A Pre-Built War?](#can-i-get-a-pre-built-war)

#### Building From Source

If you want to build from source you will need to have [Grails](http://grails.org/) 1.3.7 installed on your build machine.

Once you have the source it should be as simple as ```$ grails war``` in the root folder where you have checked out portal
then deploy the war to your application server.

Feel free to ignore the pom.xml, this is an old artifact from when we used Maven as our build tool. We now use the
Grails tooling directly to build our artifacts. We have a dependency on Maven to launch our [Jasmine](http://pivotal.github.com/jasmine/ "Jasmine BDD"),
we are in the process of removing that dependency, [you can help with that too](https://github.com/jkburges/grails-javascript-phantomjs "Grails JavaScript PhantomJS")

#### Can I Get A Pre-Built War?

Yes, you can download it [here](http://binary.aodn.org.au/).

You can also write to us, info at emii dot org dot au to discuss the best way of getting portal and keeping your
version up to date.

## Configuring Portal

You can fork portal and have your configuration included in your code base however portal offers the ability to specify
your configuration externally via an environment context variable named ```aodn.configuration``` you can clone an
example [AODN config here](https://github.com/aodn/aodn-portal-config) and modify as required. The example should be
descriptive enough to get you up and running however you can always shoot questions at us via our contact email.

### Overriding config when developing

Certain config items can be overridden by setting environment variables appropriately when running in development mode, e.g.:

```
$ GOGODUCK_URL="http://10.11.12.13/gogoduck" grails run-app
```

The full list of overridable configuration items is:

* WMS_HOST_URL
* GOGODUCK_URL
* GEONETWORK_URL
* LOG4J_CONVERSION_PATTERN

### Collaborating Applications

Portal has a few collaborating applications that you may also want to deploy

* [GeoNetwork](http://geonetwork-opensource.org/)
* [Geoserver](http://geoserver.org/)

## Getting Started (How Do I Drive This Thing?)

Read the [Getting Started guide](https://github.com/aodn/aodn-portal/wiki/Getting-Started) on the wiki
