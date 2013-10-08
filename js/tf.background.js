(function() {
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

    function getItem(name, def) {
        var item = localStorage.getItem(name);
        if(item) {
            return JSON.parse(item);
        } else {
            return def;
        }
    }

    //checks how many streams are live every 60 seconds & updates badge
    //Im not sure how expensive these pages are need to find some benchmarks before i start including libs
    tf.streams = (function(undefined) {
        "use strict";
        var defaults = {//default options
                refreshInterval: 30,//secs
                streamURL: "http://teamfortress.tv/rss/streams",
                tftvURL: "http://teamfortress.tv",
                streamsPerPage: 12,

                notifications: {
                    enable: true,
                    duration: 5
                },

                colours: {
                    badge: '#454D47',
                    hover: '#eceef0',
                    logo: '#2a2a2a',
                    listEven: '#F5F5F5',
                    listOdd: '#FCFCFC'
                },

                text: {
                    font: 'Optima, Segoe, "Segoe UI", Candara, Calibri, Arial, sans-serif;',
                    tooltips: true,
                    lineHeight: 1.6,//factor

                    name: {
                        fontsize: 15,//px
                        bold: false,
                        colour: '#000000',
                        width: false
                    },

                    title: {
                        fontsize: 14,
                        bold: false,
                        colour: '#141414',
                        width: false
                    },

                    views: {
                        fontsize: 12,
                        bold: false,
                        colour: '#535353',
                        width: 24
                    }
                }
            },
            options = {},

            lastList = [],

            initing = true,

            subscriptions = getItem("subscriptions", {
                "TeamFortressTV": {//you get auto subscribed to tftv ;)
                    link: "teamfortress.tv/streams/view/TeamFortressTV"
                }
            }),

            lock;


        //todo put this stuff in background
        function Stream(name, title, link, viewers) {
            this.name = name;
            this.title = title;
            this.link = link;
            this.viewers = viewers;
            this.subscribed = subscriptions.hasOwnProperty(name);
        }

        // get streams from streamURL
        function getStreamsXML(fun) {
            // console.time("Fetching streams");
            var xhr = new XMLHttpRequest();
            xhr.overrideMimeType('text/xml');
            xhr.open("GET", options.streamURL, true);
            xhr.onreadystatechange = (function() {
                if (xhr.readyState === 4) { //when retrieved
                    // console.timeEnd("Fetching streams");
                    //callback
                    return fun(xhr.responseXML);
                }
            });
            xhr.send(); //fetch
        }

        function processStreams(xml) {
            var streams = tf.XML(xml).find('stream');

            var names = streams.map(function(node){  return node.find("name").val(); });

            if(!initing && options.notifications.enable) {//dont do this
                names.forEach(function(name) {
                    if(subscriptions.hasOwnProperty(name) && lastList.indexOf(name) == -1) {
                        tf.browser.notify({
                            title: name + " just went live!",
                            message: "Click this notification to view their stream",
                            onClicked: function() {
                                tf.browser.openTab(subscriptions[name].link);
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
                // console.log(options.refreshInterval + ' canceled');
                cancelRefresh();
            }
        }

        function cancelRefresh() {
            clearInterval(lock);
            tf.browser.updateBadge({text:''});
            // console.log('cancelling refresh. Prev interval ' + options.refreshInterval);
        }

        function startRefresh() {
            cancelRefresh(); //safety
            if(isFinite(options.refreshInterval) && options.refreshInterval > 0) {
                refresh();
                lock = setInterval(refresh, options.refreshInterval * 1000);
            } else {
                tf.browser.updateBadge({text:''});
            }
        }

        function subscribe(name, data) {
            //Subscribes or unsubs to a given stream
            if(subscriptions.hasOwnProperty(name)) {
                unsubscribe(name);
            } else {
                subscriptions[name] = data;
                localStorage.setItem("subscriptions", JSON.stringify(subscriptions));
            }
        }

        function unsubscribe(name) {
            if(subscriptions.hasOwnProperty(name)) {
                delete subscriptions[name]
                localStorage.setItem("subscriptions", JSON.stringify(subscriptions));
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

            var userOptions = localStorage.getItem('options'), opts;
            if(userOptions) {
                opts = JSON.parse(userOptions);
                tf.merge(options, opts);
            }
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