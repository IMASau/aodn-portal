// exchange OpenLayers.Layer.WMS with OpenLayers.Layer.Image
// or reload OpenLayers.Layer.Image
// Reloading may be called from reloading a style or changing zoomlevel
function addNCWMSLayer(currentLayer) {
    // Wrap the Map call, this function used to live in mainMapPanel.js
	getMapPanel().addNCWMSLayer(currentLayer);
}


Ext.namespace('Animations');
Animations.TimePanel = Ext.extend(Ext.Panel, {
	id: 'theOnlyTimePanel',
    ref: 'theOnlyTimePanel',
    layout: 'form',
    initComponent: function() {
        this.timeMax = new Ext.form.TextField({
            ref: 'timeMax',
            fieldLabel: "End ",
            disabled: true, // readonly
            grow: true,
            labelStyle: "width:50px",
            ctCls: 'smallIndentInputBox'
        });

        this.timeMin = new Ext.form.TextField({
           ref: 'timeMin',
            fieldLabel: "Start ",
            disabled: true, // readonly
            grow: true,
            labelStyle: "width:50px",
            ctCls: 'smallIndentInputBox'
        });

        this.frameCount =  new Ext.form.TextField({
            ref: 'frameCount',
            fieldLabel: "Days",
            disabled: true, // readonly
            grow: true,
            //text: this.selectedLayer.dates.length,
            labelStyle: "width:50px",
            //labelStyle: "",
            ctCls: 'smallIndentInputBox'
        });

        this.startAnimationButton = new Ext.Button({
            id: 'startNCAnimationButton',
            text:'Start',
            disabled: true, // readonly
            //hidden: true,
            listeners: {
            	scope: this,
            	'click': function(button,event){
            	 	this.getTimePeriod();
            	}
            }
        });

        this.label = new Ext.form.Label({
            html: "<h4>Select Time Period</h4>"
        });

		this.stopNCAnimationButton = new Ext.Button({
			id: 'stopNCAnimationButton',
			text:'Stop Animation',
			hidden: true,
			listeners:{
				scope: this,
				// Until the details panel is refactored just grab a handle via Ext
                'click': function() {
					// Note selected layer is a global variable that also should be refactored
					Ext.getCmp('map').stopAnimation(this.selectedLayer);
				}
			}
		});

        this.items = [
			this.label,
			this.timeMax,
			this.timeMin,
			this.frameCount,
			this.startAnimationButton,
			this.stopNCAnimationButton
		];

        this.on("afterrender", function(whateva){
				console.log("set layer date afterrender");
				// do this only once for each layer
				// selectedLayer.metadata.datesWithData will already be defined at this point
				if (this.selectedLayer.dates == undefined) {
					this.setLayerDates(this.selectedLayer); // pass in the layer as there are going to be many async Json requests
					// disable the 'Start' button as we need all the available dates to be loaded first
					this.startAnimationButton.disable();
				}
				else {
					// after a successful animation the 'Start' button is disabled
					// the dates have been set previously for this layer so enable the button
					this.startAnimationButton.enable();
				}
			}
        , this);

        Animations.TimePanel.superclass.initComponent.apply(this);
    },

    setTimeVals: function(slider) {
    	this.remove('timePanelSlider');
        var dates = this.selectedLayer.dates;

        if(dates.length > 0){
        	this.timeSlider = new Ext.Slider({
				ref: 'timePanelSlider',
				width: 250,
				values:  [0,this.selectedLayer.dates.length-1],
				minValue: 0,
				maxValue: this.selectedLayer.dates.length-1,
				plugin: new Ext.ux.SliderTip({
					getText: function(slider){
						var thumbName = "Start";
						if (slider.index != 0) {
							thumbName = "End";
						}
						return String.format('<b>{0}:</b> {1}', thumbName,  this.selectedLayer.dates[slider.value].date);
					}
				}),
				listeners: {
					scope: this,
					changecomplete: function(slider,val,thumb) {
						// which ever thumb was moved, update the selectedLayer
						console.log("setTimeVals changecomplete");
						this.setTimeVals(slider);
					}
				}
			});

			this.insert(1, this.timeSlider);

            this.timeMin.setValue(dates[this.timeSlider.getValues()[0]].date);

            if (this.timeSlider.getValues()[1] != undefined) {
                this.timeMax.setValue(dates[this.timeSlider.getValues()[1]].date);
                this.frameCount.setValue(this.timeSlider.getValues()[1] -  this.timeSlider.getValues()[0] + 1); // + item at zero
            }
            else {
                this.timeMax.setValue(undefined);
                this.frameCount.setValue(undefined);
            }
        }
                
    },

    setSelectedLayer: function(layer){
        this.selectedLayer = layer;
    },

    setLayerDates: function(layer){
        // add this new attribute to the layer
        layer.dates = [];

        var datesWithData = layer.metadata.datesWithData;
        //var selectedDate = selectedLayer.nearestTime;

        var dayCounter = 0; // count of how many days

        for (var year in datesWithData) {
            for (var month in datesWithData[year]) {
                for (var day in datesWithData[year][month]) {
                    // add 1 to the month and number as datesWithData uses a zero-based months
                    // take the value at the index day if its a number
                    if (!isNaN(parseInt(datesWithData[year][month][day]))) {

                        var newDay = year + "-" + pad(parseInt(month)+1, 2 ) +"-" + pad(datesWithData[year][month][day], 2);
                        layer.dates.push({
                            date: newDay
                        });
                        // start off a Ajax request to add the dateTimes for this date
                        setDatetimesForDate(layer, newDay);
                        dayCounter ++;
                    }
                }
            }
        }
        // store with the layer.
        // set to undefined when setDatetimesForDate returns a result for every day
        layer.dayCounter = dayCounter;

    },
	getTimePeriod: function() {
		// disable the 'Start' button for the next possible layer
		this.startAnimationButton.disable();
		this.stopNCAnimationButton.setVisible(true);


		if (Ext.getCmp('animationPanel').animatePanelContent.theOnlyTimePanel != undefined) 	{
			//var maxFrames = 8;
			var chosenTimes = [];

			var url;
			// see if this layer is flagged a 'cached' layer. a Cached layer is already requested through our proxy
			//console.log(layer);
			if (this.selectedLayer.cache === true) {
			   url = this.selectedLayer.server.uri;
			}
			else {
			   url = this.selectedLayer.url;
			}

			var p = Ext.getCmp('animationPanel').animatePanelContent.theOnlyTimePanel;
			//alert(p);
			// get the server to tell us the options
			Ext.Ajax.request({
				scope: this,
				url: proxyURL+encodeURIComponent(url +
					"?request=GetMetadata&item=animationTimesteps&layerName=" +
					this.selectedLayer.params.LAYERS +
					"&start=" + this.getDateTimesForDate(p.timeMin.value)[0] +
					"&end=" + this.getDateTimesForDate(p.timeMax.value)[0]
				),
				success: function(resp) {
					var res = Ext.util.JSON.decode(resp.responseText);

					if (res.timeStrings != undefined) {
						// popup a window
						this.showTimestepPicker(res.timeStrings);
					}
				}
			});
    	}
    },
    // use to get the allready stored dateTimes for date
    // for the selectedLayer
    getDateTimesForDate: function(day) {
        var dateTimes = [];
        for(var i=0; i<this.selectedLayer.dates.length; i++) {
            if (this.selectedLayer.dates[i].date == day) {
                // console.log(selectedLayer.dates[i]);
                dateTimes = this.selectedLayer.dates[i].dateTimes;
            }
        }
        return dateTimes;

    },

    // modal timestep picker for animating current layer
    showTimestepPicker: function(timeStrings) {

    	// copy to the attributes needed by the Ext radioGroup
    	for (vars in timeStrings) {
    		timeStrings[vars].boxLabel = timeStrings[vars].title
    		timeStrings[vars].name = "justaname"//,
    	//timeStrings[vars].inputValue = timeStrings[vars].timeString
    	}

    	var timestepWindow =  new Ext.Window({

    		id: 'timestepWindow',
    		modal:true,
    		padding: '5px 10px',
    		shadow: false,
    		title: 'Choose Animation Period',
    		autoDestroy: true,
    		constrainHeader: true,
    		constrain: true,
    		autoScroll: true,
    		border: false,
    		items: [
    		{
    			xtype: 'label',
    			style: {
    				padding: '10px'
    			},
    			html: "<p>Please select the number of frames required.<BR>Selecting less frames will result in better performance</p>"
    		},
    		{
    			// Use the default, automatic layout to distribute the controls evenly
    			// across a single row
    			xtype: 'radiogroup',
    			fieldLabel: 'Auto Layout',
    			style: {
    				padding: '10px'
    			},
    			columns: 1,
    			items: [
    			timeStrings
    			],
    			listeners: {
    				change: function( field, newValue, oldValue, eOpts ) {
    					Ext.getCmp('timestepWindow').destroy(); // this components parent window
    					createNCWMSLayerFromTimesteps(newValue.initialConfig.timeString, this.selectedLayer);
    				}
    			}
    		}
    		]
    	});

    	timestepWindow.show();
    }

});

Ext.reg('animations.timePanel', Animations.TimePanel);

function setDatetimesForDate(layer, day) {

    var url;
    // see if this layer is flagged a 'cached' layer. a Cached layer is allready requested through our proxy
    //console.log(layer);
    if (layer.cache === true) {
       url = layer.server.uri;
       url = proxyCachedURL + encodeURIComponent(layer.server.uri) +  "?request=GetMetadata&item=timesteps&layerName=" +  layer.params.LAYERS +   "&day=" + day;
    }
    else {
       url = layer.url;
       url = proxyURL+encodeURIComponent(url +  "?request=GetMetadata&item=timesteps&layerName=" +  layer.params.LAYERS +   "&day=" + day);
    }

    // getMetadata gave us the days but not the times of the day
    Ext.Ajax.request({


        url: url,
        success: function(resp) {

            var res = Ext.util.JSON.decode(resp.responseText);
            var dateTimes = [];

            for(var i=0; i<res.timesteps.length; i++) {
                dateTimes.push(day +  "T" + res.timesteps[i]);
            }
            // store the datetimes for each day
            for(var i=0; i<layer.dates.length; i++) {
                if (layer.dates[i].date == day) {
                    layer.dates[i].dateTimes = dateTimes;
                }
            }

            layer.dayCounter--;
            //console.log(layer.dayCounter);

            // set to undef when setDatetimesForDate returns a result for every day
            // now we are safe to allow animation
            if (layer.dayCounter == 0) {
                layer.dayCounter = undefined;
                // a user may now try and pick a date to animate
                Ext.getCmp('animationPanel').setDisabled(false);
                // The 'Start' button can be shown, but it may not be rendered yet
                // try to enable in the render listener as well
                // then animation can then procede
                if (Ext.getCmp('startNCAnimationButton') != undefined) {
                    Ext.getCmp('startNCAnimationButton').enable();
                }
            }

        }
    });
}



function createNCWMSLayerFromTimesteps(timeSteps) {

        layer = Ext.getCmp('theOnlyTimePanel').selectedLayer;

		//chosenTimes.push(getDateTimesForDate(p.timeMin.value)[0]);
		//chosenTimes.push(getDateTimesForDate(p.timeMax.value)[0]);
		// get all the times between user selected range
		//var dates = setAnimationTimesteps(params);

		layer.chosenTimes = timeSteps;
		addNCWMSLayer(layer);
}








