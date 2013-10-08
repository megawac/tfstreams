//vendor specific crap
(function() {
    var back = chrome.extension.getBackgroundPage(),
        tf = (back.tf = back.tf || {});

    function noop(){}
    window.tf = tf;

    var noticeid = 0;

    if(!tf.browser) {
        //vendor dependendant functions
        tf.browser = {
        
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
                    setTimeout(notice.close, duration);
                }

                return notice;
            },


        };
    }
})();