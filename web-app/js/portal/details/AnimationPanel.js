Ext.namespace('Portal.details');

Portal.details.AnimationPanel = Ext.extend(Ext.Panel, {
    title: 'Date Animate',
    id: 'animationPanel',
    plain: true,
    layout: 'form',
    stateful: false,
    autoScroll: true,
    bodyCls: 'floatingDetailsPanel',
    style: {margin: 5},
    padding: 5,
    height: 400,

    initComponent: function(){
    	this.animatedLayers = new Array();

        this.noAnimationLabel = new Ext.form.Label({
        	hidden: true,
        	text: "This layer cannot be animated"
        });

        this.warn = new Ext.form.Label({
			padding: 5,
			width: 280,
           	text: "Only one layer can be animated at a time.  You must remove an existing animation to create " +
           		  "	a new animation"
        });


		this.speedUp = new Ext.Button({
         	icon: 'images/animation/last.png',
         	cls:'x-btn-text-icon',
         	padding: 5,
         	listeners: {
				scope: this,
				'click': function(button,event){
					this.resetTimer(this.speed / 2);
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
					this.resetTimer(this.speed * 2);
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
					this.setSlide(slider.getValue());
				}
			}
		});

		var tpl = '<tpl for="."><div class="x-combo-list-item">{displayText}</div></tpl>';

		var fields = [{
			name: 'index'
		},{
			name: 'displayText'
		}];

		this.dateStore  = new Ext.data.ArrayStore({
			autoDestroy: true,
			name: "time",
			fields: fields
		});

		this.startTimeCombo = new Ext.form.ComboBox({
			id: "startTimePicker",
			fieldLabel: 'Start',
			triggerAction: 'all',
			editable : false,
			lazyRender:true,
			mode: 'local',
			store: this.dateStore,
			valueField: 'index',
			displayField: 'displayText',
			tpl: '<tpl for="."><div class="x-combo-list-item">{displayText}</div></tpl>',
			width: 175,
			padding: 5
		});

		this.endTimeCombo = new Ext.form.ComboBox({
			id: "endTimePicker",
			fieldLabel: 'End',
			triggerAction: 'all',
			editable : false,
			lazyRender:true,
			mode: 'local',
			store: this.dateStore,
			valueField: 'index',
			displayField: 'displayText',
			tpl: '<tpl for="."><div class="x-combo-list-item">{displayText}</div></tpl>',
			width: 175,
			padding: 5
		});

		this.playButton = new Ext.Button({
			id: 'Play',
			padding: 5,
			disabled: false, // readonly
			icon: 'images/animation/play.png',
			listeners: {
				scope: this,
				'click': function(button,event){
					this.loadAnimation();
				}
			}
		});

		this.clearButton = new Ext.Button({
			id: 'Stop',
			padding: 5,
			disabled: true, // readonly
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
					this.toggleButtons(false);
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
			style: 'padding-top: 5; padding-bottom: 5',
			items: [
				this.slowDown,
				this.playButton,
				this.pauseButton,
				this.speedUp,
				this.clearButton
			]
		});

		this.timeSelectorPanel = new Ext.Panel({
		   id: 'timeSelectorPanel',
		   layout: 'form',
		   style: 'padding-top: 5',
		   items:[
				this.startTimeCombo,
				this.endTimeCombo
			]
		});

        this.controlPanel = new Ext.Panel({
        	layout: 'form',
        	items: [
				this.timeSelectorPanel,
				this.stepLabel,
				this.stepSlider,
				this.buttonsPanel,
				this.progressLabel,
				this.speedLabel
			]
        });

        this.items = [
        	this.noAnimationLabel,
        	this.warn,
			this.controlPanel
        ];

        this.timerId = -1;
        this.BASE_SPEED = 1000;
        this.speed = this.BASE_SPEED;

        this.map = Ext.getCmp("map");

//    map.events.register(type, obj, listener);
        this.map.map.events.register('moveend', this, this.onMove);

        Portal.details.AnimationPanel.superclass.initComponent.call(this);
    },

    toggleButtons: function(playing){
    	if(this.animatedLayers.length > 0){
			this.clearButton.enable();
			this.stepSlider.enable();
    	}
    	else{
    		this.stepSlider.disable();
    	}

    	if(playing){
    		//can't change the time when it's playing
    		this.startTimeCombo.disable();
			this.endTimeCombo.disable();
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

    onMove: function(){
    	//have to redraw??
    	this.counter = 0;
    	if(this.animatedLayers.length > 0){
    		this.setSlide(this.counter);
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
				if(this.map.map.getLayersBy("id", this.animatedLayers[i].id).length > 0){
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
			this.stepSlider.setValue(0);
			this.stepSlider.setMaxValue(0);
			this.stepSlider.setMinValue(0);
			this.clearButton.setText("Cancel");
			this.progressLabel.setVisible(false);

		    this.toggleButtons(false);
            this.timerId = -1;
            this.speed = this.BASE_SPEED;

        	//resetting the array
            this.animatedLayers = new Array();
		}
    },


    setSelectedLayer: function(layer){
        this.selectedLayer = layer;
    },

    setSlide: function(index){
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

    cycleAnimation: function(){
		this.progressLabel.setText("Loading... " + Math.round((this.counter + 1) / this.animatedLayers.length * 100) + "%");
		this.progressLabel.setVisible(this.isLoadingAnimation());

		if(this.counter < this.animatedLayers.length - 1){
			if(this.map.map.getLayersBy("id", this.animatedLayers[this.counter + 1].id).length == 0){
				this.map.addLayer(this.animatedLayers[this.counter + 1]);
				this.animatedLayers[this.counter + 1].display(false);
			}
			else{
				if(this.animatedLayers[this.counter + 1].numLoadingTiles == 0){
					this.counter++;
					this.setSlide(this.counter);
				}
			}
		}
		else{
			this.counter = 0;
			this.setSlide(this.counter);
			this.clearButton.setText("Clear Animation");
			this.progressLabel.setVisible(false);
		}
    },

	loadAnimation: function(){
    	if(this.startTimeCombo.getValue() == this.endTimeCombo.getValue()){
    		alert("The start and end time must not be the same");
    		return false;
    	}

    	if(this.startTimeCombo.getValue() > this.endTimeCombo.getValue()){
			alert("You must select an end date that is later than the start date");
			return false;
		}
		else{

			this.progressLabel.setVisible(true);
			this.originalLayer = this.selectedLayer;
			if(this.originalLayer.name.indexOf("animated") < 0){
				this.originalLayer.name = this.originalLayer.name + " (animated)";
            }
			newAnimatedLayers = new Array();

			//could prrrrobably work out if any of the existing layers are in the
			//new animation, but let's make it work for now.
			for( var j = this.startTimeCombo.getValue(); j <= this.endTimeCombo.getValue(); j++){
				newLayer = null;

				if(this.animatedLayers.length > 0){
					for( var i = 0; i < this.animatedLayers.length; i++){
						if(this.dateStore.getAt(j).get("displayText") === this.animatedLayers[i].params["TIME"]){
							newLayer = this.animatedLayers[i];
						}
					}
				}

				if(newLayer == null){
					newLayer = this.selectedLayer.clone();
					if(this.originalLayer.name.indexOf("animated") > 0){
						newLayer.name = this.originalLayer.name.substr(0, this.originalLayer.name.indexOf(" (animated)"))
							+ " (" + this.dateStore.getAt(j).get("displayText") + ")";
					}
					else{
						newLayer.name = this.origianlLayerName + " (" + this.dateStore.getAt(j).get("displayText") + ")";
					}
					newLayer.mergeNewParams({
						TIME: this.dateStore.getAt(j).get("displayText")
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
			this.map.addLayer(this.animatedLayers[0]);
			this.selectedLayer.setOpacity(0);
			this.stepSlider.setMinValue(0);
			this.stepSlider.setMaxValue(this.animatedLayers.length - 1);
			this.resetTimer(1000);
			this.counter = 0;
			this.toggleButtons(true);
		}
    },

    resetTimer: function(speed){
    	this.speed = speed;
    	var inst = this;
		this.counter = 0;

		if(this.animatedLayers.length > 0){
			if(this.timerId != -1){
				clearTimeout(this.timerId);
			}

			this.timerId = setInterval(function(){
				inst.cycleAnimation();
			}, speed);

		}

        //else no animation is running, so can't change the speed of the animation
    },

    setupAnimationControl: function() {
        if (this.selectedLayer == undefined) {
            return false;
        }
    },

    update: function(){
    	//Just hide everything by default
		this.noAnimationLabel.hide();
		this.controlPanel.hide();

		if(this.getSelectedLayerTimeDimension() != null && this.getSelectedLayerTimeDimension().extent != null){
			//There's a animation already configured (paused, or playing)
			if(this.animatedLayers.length == 0){
				//no animation has been set yet, so configure the panel
				this.setLayerDatesByCapability();
				this.controlPanel.setVisible(true);
				this.enable();
			}
			else if(this.selectedLayer.id == this.originalLayer.id){
				this.controlPanel.setVisible(true);
				this.enable();
			}
			//else{
			// an animation is already in place, but it is NOT the same as the actively selected layer
			//}
		}
		else{
			//No time dimension, it's a dud!
			this.disable();
			
			this.ownerCt.setActiveTab(Ext.getCmp('stylePanel').getId());
		}
    },

    setLayerDatesByCapability: function(){
    	if(this.selectedLayer != null && this.selectedLayer.dimensions != null){
    		var capDates = new Array();
    		for(var i = 0; i < this.selectedLayer.dimensions.length; i++){
    			var dim = this.selectedLayer.dimensions[i];

    			if(dim.name == "time"){
    				splitDates = dim.extent.split(",");
    				for(var j = 0; j < splitDates.length; j++){
    					capDates.push([j, splitDates[j].trim()]);
    				}
    			}
    		}

    		if(capDates.length > 0){
    			this.startTimeCombo.store.loadData(capDates);
				this.startTimeCombo.setValue(0);
				this.endTimeCombo.store.loadData(capDates);
				this.endTimeCombo.setValue(0);
				this.timeSelectorPanel.doLayout();
    		}
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

    isLoadingAnimation: function(){
    	if(this.animatedLayers.length > 0){
        	for(var i = 0; i < this.animatedLayers.length; i++){
        		if(this.map.map.getLayersBy("id", this.animatedLayers[i].id).length == 0)
        			return true;
        		if(this.animatedLayers[i].numLoadingTiles > 0){
        			return true;
        		}
        	}
    	}

    	return false;
    }
});