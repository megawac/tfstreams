$(function(undefined) {
    "use strict";
    var streamlist = $('ul#streams'),
        liveStreams = [],
        header = $('div#tftv-logo'),
        options = {/*refreshInterval:val,
            streamURL: val,
            tftvURL: val,
            badgeColour: val*/}, tfs = {};

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

    //parses xml and forms stream list
    function streamsFromXML(xml) {
        console.log(xml);
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
        var link, item, text, name, title, viewers, stream;

        /*sorting here if needed*/
        for (var i = 0; streams.length - 1; i++) {
            stream = streams[i];

            name = document.createElement('span');
            name.className = 'stream-name';
            name.textContent = stream.getName();

            title = document.createElement('span');
            title.className = 'stream-title';
            title.textContent = stream.getTitle();//fix: content to prevent html tags from being execd

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
            link.attr('stream-link', stream.getLink()).attr('title', stream.getTitle());
            link.click(streamRedirect);
            link.hover(function() {
                // Stuff to do when the mouse enters the element;

            }, function() {
                // Stuff to do when the mouse leaves the element;
                
            });
            link.append(item);

            //console.log("name: " + stream.getName() + " viewers: " + stream.getViewers());
            streamlist.append(link); //if tf.tv gets a million streamers this script has bigger problems
        };

        if(streams.length === 0) {
            text = document.createElement('span');
            text.id = 'no-streams';
            text.textContent = "Service responded with no services...";

            item = document.createElement('li');
            item.className = 'stream';
            item.appendChild(text);

            streamlist.append(item);
        }
        
        console.timeEnd('Build stream list');
    }

    //ext cant have inlines so you have to do it like this
    //redirects user to stream on a linked event. assumes attr stream-link set
    function streamRedirect(ev) {
        var url = $(ev.currentTarget).attr('stream-link');
        chrome.tabs.create({'url': url}, function(tab) {
            //redirect actions
        });
    }

    //start doing stuff
    (function init() {
        tfs = chrome.extension.getBackgroundPage().tf.streams;
        options = tfs.options;

        header.click(function(ev) {
            chrome.tabs.create({'url': optionoptions.s.tftvURL}, function(tab) {
                //redirect actions
            });
        });
        streamlist.empty();
        tfs.getStreams(streamsFromXML);
    })();
})