//options page
$(function() {
    "use strict";
    var form = $('form#options'),
        //elements

        //user json
        $customs = form.find('#custom'),

        $standard = form.find("#standard"),

        $subscriptions = form.find("#subscriptions"),


        //background page
        streams = tf.streams,
        options = streams.options,
        defaults = streams.defaultOptions,

        template = Mustache.compile($("#options-template").html());

    // https://gist.github.com/megawac/6162481
    function assign(obj, key, value) {
        var keys = key.split('.'),
            cur, ptr = obj;

        while ((cur = keys.shift()) && keys.length) {
            if (typeof ptr[cur] !== "object") {
                ptr[cur] = {};
            }
            ptr = ptr[cur];
        }
        ptr[cur] = value;
        return obj;
    }

    function lookup(obj, key) {
        var type = typeof key;
        if (type == 'string' || type == "number") key = ("" + key).split('.');
        for (var i = 0, l = key.length; i < l; i++) {
            if (obj.hasOwnProperty(key[i])) obj = obj[key[i]];
            else return undefined;
        }
        return obj;
    }


    function storeOptions(item) {
        tf.browser.storage.setItem('options', item);
    }

    function resetForm() {
        //reset for this instance
        tf.merge(options, defaults);
        //reset for future instances
        localStorage.removeItem('options');
        streams.startRefresh();
        render(); //refresh everything
    }

    function setDefault() {
        var $par = $(this).parents(".option"),
            opt = $par.attr("data-option");

        assign(options, opt, lookup(defaults, opt));
        storeOptions(options);
        render();
    }

    function updateCustoms() {
        var opts = JSON.stringify(options, null, " ");
        $customs.val(opts);
    }

    //listener to dynamically change options
    //object is source obj, prop is property name
    function changePropEvent(prop) {
        var tar = this,
            $tar = $(this),
            prop,
            val;
        if (tar.willValidate) {
            if (tar.checkValidity()) {} else {
                return false;
            }
        }

        switch (tar.type) {
            case "checkbox":
                val = tar.checked;
                break;
            case "number":
                val = tar.value | 0;
                break;
            default:
                val = tar.value;
        }

        prop = $tar.attr("data-option");
        if (!prop) {
            prop = $tar.parents(".option").attr("data-option");
        }

        assign(options, prop, val);
        updateCustoms();
        storeOptions(options);

        if (tar.type == "checkbox") render();
    }

    function render() {
        updateCustoms();
        $standard.html(template(options));
    }

    function renderSubs() {
        var subscriptions = [],
            sub;
        for (var name in streams.subscriptions) {
            sub = streams.subscriptions[name];
            subscriptions.push({
                name: name,
                link: sub.link
            });
        }
        $subscriptions.append(Mustache.render($("#subscribe-template").html(), {
            subscriptions: subscriptions
        }));
    }

    function updateBadge() {
        tf.browser.updateBadge({color: options.colours.badge});
    }


    /*******************
     *       INIT       *
     *******************/
    render();
    renderSubs();

    $standard.on("change", ".option input", changePropEvent)
        .on("change", "[data-option='refreshInterval']", streams.startRefresh)
        .on("click", ".default", setDefault)
        .on("click", "[data-option='colours.badge']", updateBadge)
        .on("change", "[data-option='colours.badge']", updateBadge)
        .on("click", "#testnotice", function() {
            tf.browser.notify({
                title: "Test Notice!",
                message: "This is a test notification"
            })
        });

    $subscriptions.on("click", ".subscription .unsubscribe", function() {
        var $par = $(this).parents(".subscription");
        streams.unsubscribe($par.attr("data-stream"));
        $par.remove();
    });
    $('#submit-options').click(function() {
        var json = $customs.val(),
            opts;
        try {
            opts = JSON.parse(json);
            tf.merge(options, opts);
            storeOptions(opts);
            render();
        } catch (err) {
            alert('Your Json sucks... Heres why: \n' + err);
        }
    });

    //wire up submit
    // form.submit(submitForm);
    $('input#reset').click(resetForm);
});