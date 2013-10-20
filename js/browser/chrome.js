//vendor specific crap
(function() {
    var back = chrome.extension.getBackgroundPage(),
        tf =  window.tf = (back.tf = back.tf || {});

    function noop(){}

    var noticeid = 0;

    if(!tf.browser) {
        //vendor dependendant functions
        var browser = tf.browser = {
        
            openTab: function(url, action) {
                chrome.tabs.create({'url': url}, action);
            },

            updateBadge: function(options) {
                var t = options.text,
                    c = options.color;

                if(t !== undefined){
                    chrome.browserAction.setBadgeText({text: (t||'')});
                }
                if(c !== undefined) {
                    chrome.browserAction.setBadgeBackgroundColor(options);
                }
            },

            notify: function(options, callback) {//api is ugly cleans it up a bit. my code it may break or something who knows
                var id = "notice" + String(noticeid++);
                var duration = options.duration;
                delete options.duration;

                ["onClicked", "onClosed"].forEach(function(name) {
                    if(options[name] && chrome.notifications[name]) {
                        var fn = options[name];
                        var listener = function(nid) {
                            if(nid == id) {
                                fn();
                                chrome.notifications[name].removeListener(listener);
                            }
                        }
                        chrome.notifications[name].addListener(listener);
                        delete options[name];
                    }
                });

                var opts = tf.merge({
                    type: "basic",
                    title: "",
                    message: "",
                    iconUrl: "img/icon.png"
                }, options);
                var notice = {
                    id: id,
                    close: function(callback) {
                        chrome.notifications.clear(id, callback||noop);
                    },
                    update: function(options) {
                        tf.merge(opts, options);
                        chrome.notifications.update(id, opts);
                    }
                }
                chrome.notifications.create(id, opts, callback||noop);

                if(duration) {
                    tf.browser.delay(notice.close, duration);
                }

                return notice;
            },

            //todo abstract the alarms api
            delay: function(fn, delay) {
                var id = setTimeout(fn, delay);
                return {
                    id: id,
                    clear: function() {
                        clearTimeout(id);
                    }
                };
            },

            throttle: function(fn, interval) {
                var id = setInterval(fn, interval);

                return {
                    id: id,
                    clear: function() {
                        clearInterval(id);
                    }
                };
            },

            storage: {
                //assumes non blocking but can be local storage
                //Get an item from storage returns a native object
                getItem: function(key, cb) {
                    //cb must be specified or you get a thrown error!
                    chrome.storage.sync.get(key, function(data) {
                        cb(data[key]);
                    });
                },

                //store an item in storage
                //takes an obj and a callback 
                //or a string, object and callback
                setItem: function(key, obj, cb) {
                    if(typeof key === "object") {
                        chrome.storage.sync.set(key, obj || noop);//object is assumed callback
                    } else {
                        var data = {};
                        data[key] = obj;
                        browser.storage.setItem(data, cb);
                    }
                },

                removeItem: function(key, cb) {
                    chrome.storage.sync.remove(key, cb || noop);
                }
            }
        };
    }
})();