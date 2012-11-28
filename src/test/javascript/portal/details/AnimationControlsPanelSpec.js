
/*
 * Copyright 2012 IMOS
 *
 * The AODN/IMOS Portal is distributed under the terms of the GNU General Public License
 *
 */

describe("Portal.details.AnimationControlsPanel", function() {
	
    var animationPanel;
    
    beforeEach(function() {
        animationPanel = new Portal.details.AnimationControlsPanel();
    });
    
	describe("_getNewTimeValue", function() {
		it("select default if old time doesn't exist", function() {
			var oldTime = "13:25:00 (+10:00)";
			
			var newTimes = new Array();
			
			newTimes[0] = "10:18:00 (+10:00)";
			newTimes[1] = "11:18:00 (+10:00)";
			newTimes[3] = "12:18:00 (+10:00)";
			newTimes[4] = "13:18:00 (+10:00)";
			newTimes[5] = "14:18:00 (+10:00)";
			newTimes[6] = "15:18:00 (+10:00)";
			newTimes[7] = "16:18:00 (+10:00)";
			
			var newTime = animationPanel._getNewTimeValue(oldTime,newTimes,5);
			
			expect(newTime).toBe("14:18:00 (+10:00)");
			
		});
	});
	
	describe("_onDateSelected", function() {

		
		it("should, if there is only one time available, select it", function() {
			var startDatePicker = new Ext.form.DateField({
				format : 'd-m-Y',
				value : '06-06-2007'
			});
			animationPanel.startDatePicker = startDatePicker;
	
			var allTimes = new Array();
			allTimes['2006-06-06'] = new Array();
			
			allTimes['2006-06-06'][0] = new Array();
			allTimes['2006-06-06'][0][0]="13:18:00 (+10:00)"
			allTimes['2006-06-06'][0][1]="13:20:00 (+10:00)"
			
			animationPanel.allTimes =allTimes;	
			
			animationPanel._onDateSelected(startDatePicker, Date.parseDate("06-06-2006", 'd-m-Y'));
			expect(animationPanel.startTimeCombo.value).toBe("13:18:00 (+10:00)");
		});
		
		it("selects earliest possible time if the previously selected time is not available", function() {
			var startDatePicker = new Ext.form.DateField({
				format : 'd-m-Y',
				value : '06-06-2007'
			});
			animationPanel.startDatePicker = startDatePicker;	
			
			var allTimes = new Array();
			allTimes['2006-06-06'] = new Array();
			
			allTimes['2006-06-06'][0] = new Array();
			allTimes['2006-06-06'][0][0]="13:18:00 (+10:00)";
			allTimes['2006-06-06'][0][1]="13:20:00 (+10:00)";
			
			allTimes['2006-06-06'][1]= new Array();
			allTimes['2006-06-06'][1][0]="14:18:00 (+10:00)";
			allTimes['2006-06-06'][1][1]="14:20:00 (+10:00)";
			
			allTimes['2006-06-06'][2]= new Array();
			allTimes['2006-06-06'][2][0]="15:18:00 (+10:00)";
			allTimes['2006-06-06'][2][1]="15:20:00 (+10:00)";
			
			animationPanel.allTimes =allTimes;	
			animationPanel.startTimeCombo.setValue("19:19:00 (+10:00)")
			
			animationPanel._onDateSelected(startDatePicker, Date.parseDate("06-06-2006", 'd-m-Y'));
			expect(animationPanel.startTimeCombo.value).toBe("13:18:00 (+10:00)");
		});
		
		it("selects previously selected time if it is available", function() {
			var startDatePicker = new Ext.form.DateField({
				format : 'd-m-Y',
				value : '06-06-2007'
			});
			animationPanel.startDatePicker = startDatePicker;	
			
			var allTimes = new Array();
			
			allTimes['2007-06-06'] = new Array();
			
			allTimes['2007-06-06'][0] = new Array();
			allTimes['2007-06-06'][0][0]="14:18:00 (+10:00)";
			allTimes['2007-06-06'][0][1]="14:20:00 (+10:00)";
			
			allTimes['2006-06-06'] = new Array();
			
			allTimes['2006-06-06'][0] = new Array();
			allTimes['2006-06-06'][0][0]="13:18:00 (+10:00)";
			allTimes['2006-06-06'][0][1]="13:20:00 (+10:00)";
			
			allTimes['2006-06-06'][1]= new Array();
			allTimes['2006-06-06'][1][0]="14:18:00 (+10:00)";
			allTimes['2006-06-06'][1][1]="14:20:00 (+10:00)";
			
			allTimes['2006-06-06'][2]= new Array();
			allTimes['2006-06-06'][2][0]="15:18:00 (+10:00)";
			allTimes['2006-06-06'][2][1]="15:20:00 (+10:00)";
			
			animationPanel.allTimes =allTimes;	
			animationPanel.startTimeCombo.setValue("14:18:00 (+10:00)")
			
			animationPanel._onDateSelected(startDatePicker, Date.parseDate("06-06-2006", 'd-m-Y'));
			expect(animationPanel.startTimeCombo.value).toBe("14:18:00 (+10:00)");
		});
	});
	
	it('on removeAll', function() {
	    
	    spyOn(animationPanel, 'isAnimating').andReturn(true);
	    spyOn(animationPanel, 'removeAnimation');
	    
	    Ext.MsgBus.publish('removeAllLayers');
	    
	    expect(animationPanel.isAnimating).toHaveBeenCalled();
        expect(animationPanel.removeAnimation).toHaveBeenCalled();
	});
});
