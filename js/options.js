//options page
$(function () {
	"use strict";
	var submit = $('input[type="submit"]'),
		//refresh
		txtRefresh = $('input[type="number"]#txtRefresh'),
		chkRefresh = $('input[type="checkbox"]#chkRefresh'),
        //Remember to update background.js if changed
        streams, options = {
        	/*refreshInterval:val,
            streamURL: val,
            tftvURL: val,
            badgeColour: val*/
        };


	function submitJobs (ev) {
		var valid = true, 
			freq = (chkRefresh.is(':checked')) ? false : txtRefresh.val();

		if(!valid) {
			ev.preventDefault();//cancel submit
		}
		options.refreshInterval = freq;

		streams.stopRefresh();
		streams.startRefresh();
	}

	function wireRefresh () {
		var freq = options.refreshInterval,
			chk = (typeof freq !== "number");
		
		txtRefresh.val(freq);
		chkRefresh.prop('checked', chk);
		txtRefresh.prop('disabled', chk);

		chkRefresh.change(function(ev) {
			var check = chkRefresh.is(':checked');
			txtRefresh.prop('disabled', check);
		});
	}

	(function init () {
		streams = chrome.extension.getBackgroundPage().tf.streams;
		options = streams.options;
		//wire up submit
		submit.submit(submitJobs);

	  	wireRefresh();
	  	//$(document).tooltip();
	})();
});