(function() {
    "use strict";
    var tf = (window.tf = window.tf || {});

    //basic deep extend
    tf.merge = (function de(o1) {
        for (var i = 1, l=arguments.length, o2; i < l; i++) {
            o2 = arguments[i];
            for (var prop in o2) {
                if (o2[prop] && o2[prop].constructor &&
                    o2[prop].constructor === Object) {
                    o1[prop] = o1[prop] || {};
                    de(o1[prop], o2[prop]);
                } else {
                    o1[prop] = o2[prop];
                }
            }
        }
        
        return o1;
    });


    //checks how many streams are live every 60 seconds & updates badge
    //Im not sure how expensive these pages are need to find some benchmarks before i start including libs
    tf.streams = (function(undefined) {
        var defaults = {//default options
                refreshInterval: 30,//secs
                streamURL: "http://www.teamfortress.tv/rss/streams",
                tftvURL: "http://www.teamfortress.tv",
                streamsPerPage: 12,

                notifications: {
                    enable: true,
                    duration: 5
                },

                colours: {
                    badge: "#454D47",
                    hover: "#eceef0",
                    logo: "#2a2a2a",
                    listEven: "#F5F5F5",
                    listOdd: "#FCFCFC"
                },

                text: {
                    font: "Optima, Segoe, \"Segoe UI\", Candara, Calibri, Arial, sans-serif;",
                    tooltips: true,
                    lineHeight: 1.6,//factor

                    name: {
                        fontsize: 15,//px
                        bold: false,
                        colour: "#000000",
                        width: false
                    },

                    title: {
                        fontsize: 14,
                        bold: false,
                        colour: "#141414",
                        width: false
                    },

                    views: {
                        fontsize: 12,
                        bold: false,
                        colour: "#535353",
                        width: 24
                    }
                }
            },
            options = {},

            lastList = [],

            initing = true,

            subscriptions,

            lock;


        function Stream(name, title, link, viewers) {
            this.name = name;
            this.title = title;
            this.link = link;
            this.viewers = viewers;
            this.subscribed = subscriptions.hasOwnProperty(name);
        }

        // get streams from streamURL
        function getStreamsXML(fun, error) {
            var xhr = new XMLHttpRequest();
            var ehandler = function() { if(error) {error(xhr, xhr.status); } };
            xhr.overrideMimeType("text/xml");
            xhr.open("GET", options.streamURL, true);
            xhr.onreadystatechange = (function() {
                if (xhr.readyState === 4) { //when retrieved
                    if(xhr.status === 200) {
                        //callback
                        return fun(xhr.responseXML || xhr.response);
                    } else {
                        ehandler();
                    }
                }
            });
            xhr.onerror = ehandler;
            xhr.send(); //fetch
        }

        function processStreams(xml) {
            var streams = tf.XML(xml).find("stream");

            var names = streams.map(function(node){  return node.find("name").val(); });

            if(!initing && options.notifications.enable) {//dont do this
                names.forEach(function(name) {
                    if(subscriptions.hasOwnProperty(name) && lastList.indexOf(name) == -1) {
                        tf.browser.notify({
                            title: name + " just went live!",
                            message: "Click this notification to view their stream",
                            onClicked: function() {
                                var link = subscriptions[name].link;
                                tf.browser.openTab(link.indexOf("//") >= 0 ? link : "http://" + link);
                            },
                            duration: options.notifications.duration *1000
                        });
                    }
                });
            } else {
                initing = false;
            }

            lastList = names;

            tf.browser.updateBadge({text: (streams.length).toString()});
        }

        function refresh () {
            getStreamsXML(processStreams);
            if(!isFinite(options.refreshInterval) || options.refreshInterval <= 0) {//safety first
                // console.log(options.refreshInterval + " canceled");
                cancelRefresh();
            }
        }

        function cancelRefresh() {
            if(lock) lock.clear();
            tf.browser.updateBadge({text:""});
            // console.log("cancelling refresh. Prev interval " + options.refreshInterval);
        }

        function startRefresh() {
            cancelRefresh(); //safety
            if(isFinite(options.refreshInterval) && options.refreshInterval > 0) {
                refresh();
                lock = tf.browser.throttle(refresh, options.refreshInterval * 1000);
            } else {
                tf.browser.updateBadge({text:""});
            }
        }

        function subscribe(name, data) {
            //Subscribes or unsubs to a given stream
            if(subscriptions.hasOwnProperty(name)) {
                unsubscribe(name);
            } else {
                subscriptions[name] = data;
                tf.browser.storage.setItem("subscriptions", subscriptions);
            }
        }

        function unsubscribe(name) {
            if(subscriptions.hasOwnProperty(name)) {
                delete subscriptions[name];
                tf.browser.storage.setItem("subscriptions", subscriptions);
            }
        }

        // //checks if a string is a number - mainly for local storage parsing
        // //returns def if its null and false if its not a number
        // function evalNumber(item, def) {
        //     var ret = (item === null) ? def key: "value", 
        //         isNaN((item = parseFloat(item))) ? false : item;
        //     return ret;
        // }

        function getLocalOptions() {
            tf.merge(options, defaults);

            tf.browser.storage.getItem("options", function(data) {
                if(typeof data !== "string") {
                    tf.merge(options, data);
                } else {
                    tf.merge(options, JSON.parse(data));
                    tf.browser.storage.setItem("options", options);//invalid
                }
            });

            tf.browser.storage.getItem("subscriptions", function(data) {
                if(typeof data == "string") {//invalid
                    data = JSON.parse(data);
                    tf.browser.storage.setItem("subscriptions", data);
                }
                subscriptions = tf.streams.subscriptions = data || {
                    "TeamFortressTV": {//you get auto subscribed to tftv by default ;)
                        link: "http://www.teamfortress.tv/streams/view/TeamFortressTV"
                    }
                };
            });
        }

        getLocalOptions();

        startRefresh();
        tf.browser.updateBadge({color: options.colours.badge});

        return {
            //props
            options : options,
            subscriptions: subscriptions,
            defaultOptions : defaults,

            //funcs
            getStreamsXML : getStreamsXML,

            startRefresh : refresh,
            stopRefresh : cancelRefresh,

            subscribe: subscribe,
            unsubscribe: unsubscribe,

            //Classes
            Stream : Stream,

            //Helpers
            merge : tf.merge
        };
    })();
})();