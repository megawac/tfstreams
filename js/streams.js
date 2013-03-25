$(function(undefined) {
    "use strict";
    var streamlist = $('ul#streams'),
        liveStreams = [],
        header = $('div#tftv-logo'),
        tftvURL = "http://teamfortress.tv",
        streamURL = "http://teamfortress.tv/rss/streams";

    function Stream(name, title, link, viewers) {
        this.name = name;
        this.title = title;
        this.link = link;
        this.viewers = viewers;
    }
    Stream.prototype.getName = function() {
        return this.name;
    };
    Stream.prototype.getTitle = function() {
        return this.title;
    };
    Stream.prototype.getLink = function() {
        return this.link;
    };
    Stream.prototype.getViewers = function() {
        return this.viewers;
    };

    //get streams from tf.tv
    function getStreams(fun) {    
        console.time("Fetching streams");
        var xhr = new XMLHttpRequest();
        xhr.open("GET", streamURL, true);
        xhr.onreadystatechange = (function() {
            if (xhr.readyState === 4) { //when retrieved
                console.timeEnd("Fetching streams")
                //callback
                fun(xhr.responseText);
            }
        });
        xhr.send(); //fetch
    }

    //parses xml and forms stream list
    function streamsFromXML(xml) {
        console.time('parse xml');
        var doc = $.parseXML(xml),
                    streams = $(doc).find('stream'), stream;
        $.each(streams, function(index, node) {
            node = $(node);
            stream = new Stream(node.find('name').text(),
                                node.find('title').text(),
                                node.find('link').text(),
                                node.find('viewers').text());
            liveStreams.push(stream);
        });
        console.timeEnd('parse xml');
        buildStreamList(liveStreams);
    }

    function buildStreamList(streams) {
        console.time('Build stream list');
        var link, item, text, name, title, viewers;
        $.each(streams, function(index, stream) {
            name = document.createElement('span');
            name.className = 'stream-name';
            name.innerText = stream.getName();

            title = document.createElement('span');
            title.className = 'stream-title';
            title.innerText = stream.getTitle();

            text = document.createElement('span');
            text.className = 'stream-text';
            text.appendChild(name);
            text.appendChild(title);

            viewers = document.createElement('span');
            viewers.className = 'stream-view-count';
            viewers.innerText = stream.getViewers();

            item = document.createElement('li');
            item.className = 'stream';
            item.appendChild(text);
            item.appendChild(viewers);

            link = $('<a>');
            link.attr('stream-loc', stream.getLink()).attr('title', stream.getTitle());
            link.append(item);
            //redirect on click to url
            link.click(function (ev) {
                var url = $(ev.currentTarget).attr('stream-loc'); //ext cant have inlines
                chrome.tabs.create({'url': url}, function(tab) {
                    //redirect actions
                });
            });
            //console.log("name: " + stream.getName() + " viewers: " + stream.getViewers());
            streamlist.append(link); //if tf.tv gets a million streamers this script has bigger problems
        });
        chrome.browserAction.setBadgeText({text: (streams.length).toString()});
        console.timeEnd('Build stream list');
    }

    //start doing stuff
    (function init() {
        header.click(function(ev) {
            chrome.tabs.create({'url': tftvURL}, function(tab) {
                //redirect actions
            });
        });
        chrome.browserAction.setBadgeBackgroundColor({color: '#D7EFFA'});
        streamlist.empty();
        getStreams(streamsFromXML);
    })();
})