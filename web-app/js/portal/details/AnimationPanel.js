Ext.namespace('Portal.details');

Portal.details.AnimationPanel = Ext.extend(Ext.Panel, {
    
    constructor: function(cfg) {
    	var config = Ext.apply({
    		id: 'animationPanel',
    	    plain: true,
    	    layout: 'form',
    	    stateful: false,
    	    //style: { margin: 5 },
			defaults: {
				cls: 'fullTransparency'
			},
			
			//overCls: "",
    	    height: 220,
    	    //unstyled: true,
    	    width: '100%',
			listeners: {
				render: function(p) {
					//magic to get animation control in the middle~!
					//p.getEl().parent("table").wrap({tag:'center'});
				},
				single: true  // Remove the listener after first invocation
			}
    	}, cfg);

        Portal.details.AnimationPanel.superclass.constructor.call(this, config);
    },

    initComponent: function(){
    	this.animatedLayers = new Array();

        this.warn = new Ext.form.Label({
			padding: 5,
			width: 280,
           	text: "Only one layer can be animated at a time.  You must remove an existing animation to create " +
           		  "	a new animation."
        });

		this.speedUp = new Ext.Button({
         	icon: 'images/animation/last.png',
         	plain: true,
         	padding: 5,
         	listeners: {
				scope: this,
				'click': function(button,event){
					this._resetTimer(this.speed / 2);
				}
			},
			tooltip: "Doubles animation speed"
		});

		this.slowDown = new Ext.Button({
         	icon: 'images/animation/first.png',
         	padding: 5,
         	listeners: {
				scope: this,
				'click': function(button,event){
					this._resetTimer(this.speed * 2);
				}
			},
			tooltip: "Halves animation speed"
		});

		this.label = new Ext.form.Label({
			html: "<h4>Select Time Period</h4>"
		});

        this.stepSlider = new Ext.Slider({
			id: 'stepSlider',
			ref: 'stepSlider',
			width: 280,
			listeners:{
				scope: this,
				drag: function(slider, e){
					this._setSlide(slider.getValue());
				}
			}
		});

		this.playButton = new Ext.Button({
			id: 'Play',
			padding: 5,
			plain: true,
			disabled: false, // readonly
			icon: 'images/animation/play.png',
			listeners: {
				scope: this,
				'click': function(button,event){
					this._loadAnimation();
				}
			}
		});

		this.clearButton = new Ext.Button({
			id: 'Stop',
			padding: 5,
			plain: true,
			text: "Cancel",
			iconAlign: 'top',
			listeners: {
				scope: this,
				'click': function(button,event){
					this.removeAnimation();
				}
			},
			tooltip: "Stops animation and remove all animated layers from map"
		});

		this.pauseButton = new Ext.Button({
			id: 'Pause',
			padding: 5,
			disabled: true, // readonly
			icon: 'images/animation/pause.png',
			iconAlign: 'top',
			listeners: {
				scope: this,
				'click': function(button,event){
					clearTimeout(this.timerId);
					this.pausedTime = this.animatedLayers[this.counter].params["TIME"];
					this._toggleButtons(false);
				}
			},
			tooltip: "Pauses animation and can explore individual time step using the slider above"
		});

		this.stepLabel = new Ext.form.Label({
			html: "Time: <br />",
			width: 300,
			style: 'padding-top: 5'
		});

		this.progressLabel = new Ext.form.Label({
		   hidden: true,
		   width: 100,
		   left: 150
		});

		this.speedLabel = new Ext.form.Label({
		   hidden: true,
		   text: "speed",
		   width: 100,
		   left: 150
		});

		this.buttonsPanel = new Ext.Panel({
			id: 'playerControlPanel',
			layout: 'hbox',
			plain: true,
			items: [
				this.slowDown,
				this.playButton,
				this.pauseButton,
				this.speedUp,
				this.clearButton
			],
			width: 400
		});

		this.startDatePicker = new Ext.form.DateField({
			fieldLabel: 'Start',
			format: 'd-m-Y',
			editable: false,
			listeners:{
				scope: this,
            	select: this._onDateSelected
			}
		});

		this.endDatePicker = new Ext.form.DateField({
			fieldLabel: 'End',
			format: 'd-m-Y',
			editable: false,
			listeners:{
				scope: this,
				select: this._onDateSelected
			}
		});

		this.startTimeCombo = new Ext.form.ComboBox({
			store: new Array()
		});
		this.endTimeCombo = new Ext.form.ComboBox({
			store: new Array()
		});

		this.timeSelectorPanel = new Ext.Panel({
		   id: 'timeSelectorPanel',
		   layout: 'form',
		   plain: true,
		   items:[
				this.startDatePicker,
				this.startTimeCombo,
				this.endDatePicker,
				this.endTimeCombo
			]
		});

        this.controlPanel = new Ext.Panel({
        	layout: 'form',
        	plain: true,
        	items: [
        		this.buttonsPanel,
				this.timeSelectorPanel,
				this.stepLabel,
				this.stepSlider,
				this.progressLabel,
				this.speedLabel
			],
			width: 500,
			height: '100%'
        });

        this.items = [
			this.controlPanel
        ];

        this._resetForNewAnimation();
        this.map = Ext.getCmp("map");

        this.map.map.events.register('moveend', this, this.onMove);

        this.pausedTime = "";

        Portal.details.AnimationPanel.superclass.initComponent.call(this);
    },

    _onDateSelected: function(field, date){
    	var combo;

    	if(field === this.startDatePicker){
    		combo = this.startTimeCombo;
    	}
    	else{
    		combo = this.endTimeCombo;
    	}

    	var key = date.format("Y-m-d");
    	if(this.allTimes[key] != null){
    		store = combo.getStore();
    		store.removeAll();
    		store.loadData(this.allTimes[key]);
    		combo.enable();
    	}
    	else{
    		combo.disable();
    	}

    },

    _resetForNewAnimation: function(){
    	this.timerId = -1;
		this.BASE_SPEED = 500;
		this.stepSlider.setValue(0);
		this.stepSlider.setMaxValue(0);
		this.stepSlider.setMinValue(0);
		this.originalOpacity = -1;
		this.speed = this.BASE_SPEED;
		this.pausedTime = "";
		this.allTimes = {};

		//resetting the array
		this.animatedLayers = new Array();
	},

    _toggleButtons: function(playing){
    	if(this.animatedLayers.length > 0){
			this.clearButton.enable();
			this.stepSlider.enable();
    	}
    	else{
    		this.stepSlider.disable();
    	}

    	if(playing){
    		//can't change the time when it's playing
    		this.playButton.disable();
			this.pauseButton.enable();
			this.stepSlider.disable();
			this.speedUp.enable();
			this.slowDown.enable();
    	}
        else{
        	this.startTimeCombo.enable();
			this.endTimeCombo.enable();
			this.playButton.enable();

			//nothing's playing, so stop and pause doesn't make sense
			this.pauseButton.disable();
			this.speedUp.disable();
			this.slowDown.disable();
        }
    },

    _onMove: function(){
    	//have to redraw??
    	if(this.animatedLayers.length > 0){
    		this._setSlide(this.counter);
    	}

    },

	removeAnimation: function(){
    	if(this.animatedLayers.length > 0){
    		clearTimeout(this.timerId);

    		if(this.map == null){
    			this.map = Ext.getCmp("map");
    		}

    		this.originalLayer.name = this.originalLayer.name.substr(0, this.originalLayer.name.indexOf(" (animated)"));
			this.originalLayer.setOpacity(this.originalOpacity);

			for(var i = 0; i < this.animatedLayers.length; i++){
				if(this.map.map.getLayer(this.animatedLayers[i].id)){
					this.map.removeLayer(this.animatedLayers[i], this.originalLayer);
				}

				if(this.animatedLayers[i].div != null) {
					if(this.animatedLayers[i].map != null)
						this.animatedLayers[i].destroy();
				}
			}

			//stackoverflow says it's better setting length to zero than to reinitalise array.,.,.,
			this.animatedLayers.length = 0;
			this.stepLabel.setText("Time: <br />", false);

			this.clearButton.setText("Cancel");
			this.progressLabel.setVisible(false);
		    this._toggleButtons(false);

            this._resetForNewAnimation();
            delete this.originalLayer.isAnimated;
		}

    },

    setSelectedLayer: function(layer){
        this.selectedLayer = layer;
    },

    _setSlide: function(index){
    	if(this.animatedLayers != undefined){

    		for(var i = 0; i < this.animatedLayers.length; i++){
				this.animatedLayers[i].display(i == index);
			}

			//this should still work even if there's no animation, i.e. paused
			this.stepSlider.setValue(index);

			//also set the label
			labelStr = "Time: " + this.animatedLayers[index].params.TIME;

			this.stepLabel.setText(labelStr + "<br />", false);
    	}
    },

    _cycleAnimation: function(forced){
		this.progressLabel.setText("Loading... " + Math.round((this.counter + 1) / this.animatedLayers.length * 100) + "%");
		this.progressLabel.setVisible(this._isLoadingAnimation());

		if(this.counter < this.animatedLayers.length - 1){
			if(this.map.map.getLayer(this.animatedLayers[this.counter + 1].id) == null){
				this.map.addLayer(this.animatedLayers[this.counter + 1], false);
				this.animatedLayers[this.counter + 1].display(false);
			}
			else{
				if(this.animatedLayers[this.counter + 1].numLoadingTiles == 0){
					this.counter++;
					this._setSlide(this.counter);

				}
			}
		}
		else{
			this.counter = 0;
			this._setSlide(this.counter);

			this.clearButton.setText("Clear Animation");
			this.progressLabel.setVisible(false);
		}
    },

	_loadAnimation: function(){

        var startString = this.startDatePicker.getValue().format("Y-m-d") + "T" + this.startTimeCombo.getValue();
        var endString = this.endDatePicker.getValue().format("Y-m-d") + "T" + this.endTimeCombo.getValue();

        console.log("loading animation with " + startString + " and " + endString);

        dimSplit = this.getSelectedLayerTimeDimension().extent.split(",");

        var startIndex = dimSplit.indexOf(startString);
        var endIndex = dimSplit.indexOf(endString);

        console.log("startIndexL " + startIndex + " endIndex:  " + endIndex);

    	if(startIndex == endIndex){
    		alert("The start and end time must not be the same");
    		return false;
    	}

    	if(startIndex > endIndex){
			alert("You must select an end date that is later than the start date");
			return false;
		}
		else{

			this.progressLabel.setVisible(true);
			this.originalLayer = this.selectedLayer;
			if(this.originalOpacity == -1)
				this.originalOpacity = this.selectedLayer.opacity;

			if(this.originalLayer.name.indexOf("animated") < 0){
				this.originalLayer.name = this.originalLayer.name + " (animated)";
				this.originalLayer.isAnimated = true;
            }
			newAnimatedLayers = new Array();

			//could prrrrobably work out if any of the existing layers are in the
			//new animation, but let's make it work for now.
			for( var j = startIndex; j <= endIndex; j++){
				newLayer = null;

				if(this.animatedLayers.length > 0){
					for( var i = 0; i < this.animatedLayers.length; i++){
						if(dimSplit[i] === this.animatedLayers[i].params["TIME"]){
							newLayer = this.animatedLayers[i];
						}
					}
				}

				if(newLayer == null){
					newLayer = this.selectedLayer.clone();
					if(this.originalLayer.name.indexOf("animated") > 0){
						newLayer.name = this.originalLayer.name.substr(0, this.originalLayer.name.indexOf(" (animated)"))
							+ " (" + dimSplit[j] + ")";
					}
					else{
						newLayer.name = this.originalLayer.name + " (" + dimSplit[j] + ")";
					}
					newLayer.mergeNewParams({
						TIME: dimSplit[j]
					});

					newLayer.setVisibility(true);
					newLayer.setOpacity(1);
					newLayer.display(false);
					newLayer.isAnimated = true;
				}

				newAnimatedLayers.push(newLayer);
			}

			this.animatedLayers = newAnimatedLayers;

			//always pre-load the first one
			this.map.addLayer(this.animatedLayers[0], false);

			this.selectedLayer.setOpacity(0);
			this.stepSlider.setMinValue(0);
			this.stepSlider.setMaxValue(this.animatedLayers.length - 1);
			this._resetTimer(this.BASE_SPEED);
			if(this.pausedTime !== ""){
				this.counter = this._getIndexFromTime(this.pausedTime);
			}
			else{
				this.counter = 0;
			}
			this._toggleButtons(true);
		}
    },

    _resetTimer: function(speed){
    	this.speed = speed;
    	var inst = this;

		if(this.animatedLayers.length > 0){
			if(this.timerId != -1){
				clearTimeout(this.timerId);
			}

			this.timerId = setInterval(function(){
				inst._cycleAnimation();
			}, speed);

		}

        //else no animation is running, so can't change the speed of the animation
    },

    update: function() {
		this.controlPanel.hide();

		if(this.getSelectedLayerTimeDimension() != null && this.getSelectedLayerTimeDimension().extent != null){
			//There's a animation already configured (paused, or playing)
			if(this.animatedLayers.length == 0){
				//no animation has been set yet, so configure the panel
				this._setLayerDatesByCapability();
				this.controlPanel.setVisible(true);
			}
			else if(this.selectedLayer.id == this.originalLayer.id){
				this.controlPanel.setVisible(true);
			}
		}
		else{
			//No time dimension, it's a dud!
			hide.call(target, this);
		}
    },

    _setDateRange: function(combo, startDate, endDate){
    	combo.setMinValue(startDate);
		combo.setMaxValue(endDate);
		combo.setValue(startDate);
    },

    _extractDays: function(dim){
    	splitDates = dim.extent.split(",");
    	var startDate;
    	var endDate;

		if(splitDates.length > 0){
			startDate = new Date(splitDates[0]);
			endDate = new Date(splitDates[splitDates.length - 1]);

			//set the start/end date range for both pickers
			this._setDateRange(this.startDatePicker, startDate, endDate);
			this._setDateRange(this.endDatePicker, startDate, endDate);

			//then calculate the missing days
			var missingDays = [];

			for(var j = 0; j < splitDates.length; j++){
				var dayTime = splitDates[j].split("T");
				var dayString = dayTime[0];
				var timeString = dayTime[1];

				if(this.allTimes[dayString] == null){
					this.allTimes[dayString] = new Array();
				}
				this.allTimes[dayString].push(timeString);
			}

			var curDate = new Date(splitDates[0]);
			while(curDate <= endDate){
				day = curDate.toISOString().split("T")[0];

				if(this.allTimes[day] == null){
					missingDays.push(curDate.format("d-m-Y"));
				}
				curDate.setDate(curDate.getDate() + 1);
			}

			this.startDatePicker.setDisabledDates(missingDays);
            this.endDatePicker.setDisabledDates(missingDays);
		}
    },

    _setLayerDatesByCapability: function(){
    	var dim = this.getSelectedLayerTimeDimension();
    	if(dim != null){
    		this._extractDays(dim);
			//TODO: set default to last 10 timestamp for instant animation
    	}

    },

	setSelectedLayer: function(layer){
		this.selectedLayer = layer;
	},

    getSelectedLayerTimeDimension: function(){
    	if((this.selectedLayer != undefined) && (this.selectedLayer.dimensions != undefined)){
    		for(var i = 0; i < this.selectedLayer.dimensions.length; i++){
    			if(this.selectedLayer.dimensions[i].name == "time"){
    				return this.selectedLayer.dimensions[i];
    			}
    		}
    	}
    	return null;
    },

    _isLoadingAnimation: function(){
    	if(this.animatedLayers.length > 0){
        	for(var i = 0; i < this.animatedLayers.length; i++){
        		if(this.map.map.getLayer(this.animatedLayers[i].id) == null )
        			return true;
        		if(this.animatedLayers[i].numLoadingTiles > 0){
        			return true;
        		}
        	}
    	}

    	return false;
    },

    _getIndexFromTime: function(timeStr){
    	if(this.animatedLayers.length > 0){
    		for(var i = 0; i < this.animatedLayers.length; i++){
    			if(this.animatedLayers[i].params["TIME"] === timeStr)
    				return i;
    		}
    	}

    	return -1;
    }
});