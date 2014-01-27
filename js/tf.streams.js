$(function() {
    "use strict";
    var doc = document;
    var $streamlist = $("ul.streams"),
        tfs = tf.streams,//background stuff
        options = tfs.options,
        template;

    //parses xml and forms stream list
    function streamsFromXML(xml, fun) {
        // console.time("custom xml parse");
        var doc = tf.XML(xml),
            xstream;

        var live = doc.find("stream")
        .map(function (node) {
            xstream = new tfs.Stream(node.first("name").val(),
                                    node.first("title").val(),
                                    node.first("link").val(),
                                    node.first("viewers").val());
            //live.push(xstream);
            return xstream;
        });

        // console.timeEnd("custom xml parse");

        fun(live);
        return live;
    }

    //builds stream list from an array of streams
    function buildStreamList(live) {
        // console.time("Build stream list");

        $streamlist.append(template({
            streams: live
        }));

        // console.timeEnd("Build stream list");
    }


    function streamError() {
        $streamlist.hide();
        $("#error").show();
    }

    //creates custom style sheet for user
    function applyStyles() {
        var text = options.text,
            //style sheet stuff
            max = Math.max(text.name.fontsize, text.title.fontsize, text.views.fontsize),

            lineHeight = max * text.lineHeight;

        var context = tfs.merge({
            itemHeight: lineHeight,
            listHeight: options.streamsPerPage * lineHeight,
            subscriberMT: (lineHeight - 16) /2,
            textWidth: options.notifications.enable ? 264 : 280//hiding the favourite icon
        }, options);

        var css = Mustache.render($("#styles").html(), context);

        var $styles = $("<style>", {type: "text/css", rel: "stylesheet"}).html(css);
        $(doc.head).append($styles);
    }


    /*******************
    *       INIT       *
    *******************/
    tfs.getStreamsXML(function (xml) {
        streamsFromXML(xml, buildStreamList);
    }, streamError);

    //while ajax loads doc do some stuff

    applyStyles(); //applies user styles


    template = Mustache.compile($("#stream-list").html());//precompile nothing better to do right now

    //redirects user to stream on a linked event. assumes attr stream-link set
    $streamlist.on("click", ".subscribe", function(evt) {
        evt.stopImmediatePropagation();
        var $ele = $(this),
            $par = $ele.parents(".stream");
        $ele.toggleClass("favourite");
        tfs.subscribe($par.attr("stream-name"), {
            link: $par.attr("stream-link")
        });
    });
    $(document).on("click", "a", function(evt) {//redirect to stream or url
        tf.browser.openTab(this.getAttribute("stream-link") || this.href);
        evt.preventDefault();
        evt.stopPropagation();
        window.close(); //close popup
    });
});