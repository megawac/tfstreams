//checks how many streams are live every 60 seconds & updates badge
//Im not sure how expensive these pages are need to find some benchmarks before i start including libs
(function(window, undefined) {
    "use strict";
    var namespace, //namespace of the function to be made public
        defaults = {
                        refreshInterval: 60,//secs
                        streamURL: "http://teamfortress.tv/rss/streams",
                        tftvURL: "http://teamfortress.tv",
                        badgeColour: '#454D47'
                    },
                    options = {defaults: defaults},
                    parser = new DOMParser(),
                    lock;

    // get streams from streamURL
    function getStreams(fun) {    
        console.time("Fetching streams");
        var xhr = new XMLHttpRequest();
        xhr.open("GET", options.streamURL, true);
        xhr.onreadystatechange = (function() {
            if (xhr.readyState === 4) { //when retrieved
                console.timeEnd("Fetching streams")
                //callback
                fun(xhr.responseText);
            }
        });
        xhr.send(); //fetch
    }

    //TO DO merge stream.js & this parser
    function updateBadge(xml) {
        var doc = parser.parseFromString(xml, 'text/xml'),
            streams = doc.getElementsByTagName('stream');
        chrome.browserAction.setBadgeText({text: (streams.length).toString()}); //update badge
    }

    function refresh () {
        getStreams(updateBadge);
        lock = setTimeout(refresh, options.refreshInterval * 1000);//recursive refresh
    }

    function cancelRefresh() {
        clearTimeout(lock);
    }

    //links window.tf.streams to several things
    //so we can do -> chrome.extension.getBackgroundPage().getStreamOptions().tf.streams on other pages for access
    //To do place a bunch of accessible functions in here like get streams
    function mapNameSpace() {
        //dirty mapping
        var tf = window.tf = window.tf || {};
        namespace = tf.streams = tf.streams || {};

        //props
        namespace.options = options;
        namespace.defaultOptions = defaults;

        //funcs
        namespace.getStreams = getStreams;
        namespace.startRefresh = refresh;
        namespace.stopRefresh = cancelRefresh;
    }

    function getLocalOptions() {
        //Better to store object? im not sure would need to include a json lib.. worth it?
        //TODO good place to use $.extend
        var freq = localStorage.getItem('refreshInterval'),
            url = localStorage.getItem('streamURL'),
            col = localStorage.getItem('badgeColour'); 
        
        options.refreshInterval = freq || defaults.refreshInterval;
        options.badgeColour = col || defaults.badgeColour;
        options.streamURL = url ||defaults.streamURL;
        //console.log(options);
    }

    (function init () {
        getLocalOptions();
        mapNameSpace();

        if(typeof options.refreshInterval === "number") {
            chrome.browserAction.setBadgeBackgroundColor({color: options.badgeColour});
            refresh();
        }//else dont refresh
    })();
})(window);