//Prototype light XML parser allowing $esque chaining for modern browsers. Assumes implemented ecma standard
//http://caniuse.com/queryselector
; (function(ns, document) {
    "use strict";
    var notWhiteSpace = /[^ \f\n\r\t\v]/,
        //config options
        options = {
            keepRaw: false
        };

    //hidden wrapper class
    function XML (element) {
        this.element = element;
        this.length = element.length || 1;
    }
    XML.prototype = {
        valueOf: function() {
            return this.element;
        },
        find: function(selector) {
            return CXML.find(this.element, selector);
        },
        first: function(selector) {
            return CXML.first(this.element, selector);
        },
        val: function() {
            return _val(this.element);
        },
        attr: function(selector) {
            return _attr(this.element, selector);
        },

        each: function(it) {
            return Array.prototype.slice.call(this.element).forEach(it, this);
        },
        map: function(it) {
            return Array.prototype.slice.call(this.element).map(it, this);
        },

        parse: function(keepRaw) {
            if(keepRaw === undefined) {
                keepRaw = options.keepRaw;
            }
            return toObj(this.element, keepRaw);
        }
    };

    //wraps an element reasonably smartly
    function CXML(element) {
        if (element instanceof XML) {
            return element;
        } else if (typeof element === "string") {
            return CXML.parseXML(element);
        } else {
            return new XML(element);
        }
    }

    //parse an xml string into an xml document
    CXML.parseXML = function( data ) {
        if ( !data || typeof data !== "string" ) {
            return null;
        }
        var xml, tmp;
        if (window.DOMParser) {
            tmp = new DOMParser();
            xml = tmp.parseFromString( data , "text/xml" );
        } else { //ie 8-... Interestingly jQuery no longer supports this
            xml=new ActiveXObject("Microsoft.XMLDOM");
            xml.async=false;
            xml.loadXML(data);
        }
        if ( !xml || !xml.documentElement || xml.getElementsByTagName( "parsererror" ).length ) {
            throw new Error( "Invalid XML: " + data );
        }
        return CXML(xml);
    }

    //my function finds tagname in xml string. use sizzle if you want more complex
    //xml: a element - prob instance of CXML
    //sel: a css selector string
    //@return: array of found objects
    CXML.find = function(xml, sel) {
        var ele,
            nodes = [],
            node,

            i;

        if(!xml) {
            return null;
        }
        //checks if query-able
        //else try to makeit work anyway
        if(!!xml.querySelectorAll) {
            //filter items into node list
            //TODO is XPaths worth it? Huge bitch to implement
            ele = xml.querySelectorAll(sel);

            //wrap nodes and put in an array if really nodelist
            for (i = 0; i < ele.length; i++) {
                node = CXML(ele[i]);
                nodes.push(node);
            }
        } else if(xml instanceof NodeList || //recurse iterate nodes, returning .find for kids
                    xml instanceof Array) { //@TODO wrap arrays
            //iterate nodes - doesnt
            for (i = 0; i < xml.length; ++i) {
                //recurse
                node = CXML.find(xml[i], sel);
                if(!!node){
                    nodes.push(node);
                }
            }
        } else if(xml instanceof XML) {
            return CXML.find(xml.element, sel);
        } else {
            throw 'bad xml baddie';
        }

        return CXML(nodes);
    }


    //same as find except returns first ele
    CXML.first = function(xml, sel) {
        var ele,
            node;

        if(!xml) {
            return null;
        }
        if(!!xml.querySelectorAll) {
            ele = xml.querySelector(sel);
        } else if(xml instanceof NodeList || xml instanceof Array) {
            ele = CXML.find(xml[0], sel);
        } else {
            throw 'bad xml baddie';
        }

        return CXML(ele);
    }

    //exposed method for calling toObj
    CXML.parse = function (xml, keepRaw) {
        var e = xml instanceof XML ? xml.element : xml;
        if(keepRaw === undefined) {
            keepRaw = options.keepRaw;
        }
        return toObj(e, keepRaw);
    }


    /*********
    *Basic Helpers
    ***********/

    //Gets the value of an element
    function _val(ele) {
        var t;
        if (ele instanceof XML) {
            return _val(ele.element);
        } else if (ele.length) {//check if nodelist/array
            return _val(ele[0]);
        } else if ((t=ele.firstChild)) {
            return t.data;
        } else {
            return ele.data;
        }
    }

    //get an attribute
    function _attr(ele, attr) {
        if (ele instanceof XML) {
            return _attr(ele.element);
        } else if (!!ele.length) {
            return _attr(ele[0]);
        } else {
            return ele.getAttribute(attr);
        }
    }


    /*  ****************
    *   TO XML
    *******************/
    // CXML.toXML = function(obj, options) {
    //     var serializer,
    //         imp = document.implementation,
    //         type = typeof obj,
    //         doc;

    //     if(imp) {
    //         doc = imp.createDocument(options.namespace, options.head, DocumentType.DOCUMENT_NODE);
    //     } else {
    //         doc = document.open();
    //     }

    //     // function that creates the XML structure
    //     // stolen from http://stackoverflow.com/posts/3191559/revisions
    //     function Σ() {
    //         var node = doc.createElement(arguments[0]),
    //             text,
    //             child,
    //             type,
    //             i, l;

    //         for(i = 1, l = arguments.length; i < l; ++i) {
    //             child = arguments[i];
    //             if(isPrimitive(child)) {
    //                 child = doc.createTextNode(child);
    //             }
    //             node.appendChild(child);
    //         }

    //         return node;
    //     }

    //     function X(obj, par, name) {
    //         var xml,
    //             kid,
    //             i, l;

    //         if(typeof name !== "string") {
    //             throw "Bad key";
    //         }

    //         if(obj.nodeType) {
    //             xml = obj;

    //         } else if (obj instanceof XML) {
    //             X(obj.element, xml);

    //         } else if (isPrimitive(obj)) {//values
    //             xml = obj;

    //         } else {

    //             for (var temp in obj) {

    //                 if(obj.hasOwnProperty(temp)) {
    //                     Σ(toXML(obj[temp], par, temp));
    //                 }

    //             }

    //         }

    //         Σ(xml);
    //     }

    //     xml.xmlVersion = options.version;
    //     X(obj, xml, options.head);

    //     serializer = new XMLSerializer();
    //     return serializer.serializeToString(xml);
    // }
    // /* ************
    // *   ToObject 
    // ***************/
    // //XML to Object converter based on Stefan Goessner's XML/JSON library
    // //Library: http://goessner.net/download/prj/jsonxml/
    // //Recursively builds an object based on XML hierarchy

    // //TODO finish adapting as this method still uses ancient techniques

    // /*BUGS:
    // *   Breaks if passed array
    // */
    // //See https://developer.mozilla.org/en-US/docs/DOM/Node for node stuff
    // //xml is an xml formed node or document
    // //keepRaw specifies whether cdata and text nodes should be removed
    // function toObj(xml, keepRaw) {
    //     var obj = {},

    //         //dom vals for storage optimization
    //         node,
    //         nodes,
    //         name,
    //         ptype,
    //         ktype,
    //         attr,
    //         //dom properties
    //         pFirstKid = keepRaw ? 'firstChild' : 'firstElementChild',
    //         pNextSib = keepRaw ? 'nextSibling' : 'nextElementSibling',
    //         //counters
    //         countText,
    //         countCData,
    //         hasElements,
    //         hasAttr,

    //         l, i;

    //     if(!xml) {
    //         return xml; //return undefined?
    //     } else if(xml instanceof XML) {
    //         return toObj(xml.element);
    //     } else if ((ptype = xml.nodeType) === Node.ELEMENT_NODE) {   // element node ..

    //         if ((hasAttr = xml.hasAttributes())) {
    //             for (i = 0, l = xml.attributes.length; i < l; ++i) {
    //                 attr = xml.attributes[i];
    //                 obj["@" + attr.nodeName] = (attr.nodeValue||"").toString();
    //             }
    //         }

    //         // element has child nodes ..
    //         if (xml instanceof Element) {
    //             countText=0;
    //             countCData=0;

    //             //TODO this loop is bad and a waste
    //             //checks to see if any of the children have element kids and counts the non element ones
    //             //must be better way
    //             for (i = 0, nodes = xml.childNodes, l = nodes.length; i < l; ++i) {
    //                 node = nodes[i];
    //                 if (node.nodeType === Node.ELEMENT_NODE) {
    //                     hasElements = true;
    //                 } else if (node.nodeType === Node.TEXT_NODE && node.nodeValue.match(notWhiteSpace))  {//text & not whitespace text
    //                     countText += 1;
    //                 } else if (node.nodeType === Node.CDATA_SECTION_NODE) {// cdata section node
    //                     countCData += 1;
    //                 }
    //             }

    //             if (hasElements) {
    //                 // structured element with evtl. a single text or/and cdata node ..
    //                 if (countText <= 1 && countCData <= 1) {
    //                     removeWhite(xml);

    //                     //transverse children and map them to the ret- obj-
    //                     for (node=xml[pFirstKid]; node; node=node[pNextSib]) {
    //                         ktype = node.nodeType;
    //                         name = node.nodeName;

    //                         if (ktype === Node.TEXT_NODE) {
    //                             obj["#text"] = escapeString(node.nodeValue);
    //                         } else if (ktype === Node.CDATA_SECTION_NODE) {
    //                             obj["#cdata"] = escapeString(node.nodeValue);
    //                         }

    //                         else if (obj[name]) { //Make an array if multiple elements
    //                             if (obj[name] instanceof Array) {
    //                                 obj[name][obj[name].length] = toObj(node, keepRaw);
    //                             } else {
    //                                 obj[name] = [obj[name], toObj(node, keepRaw)];
    //                             }

    //                         } else { // first occurence of element..
    //                            obj[name] = toObj(node, keepRaw);
    //                         }

    //                     }
    //                 } else { // mixed content
    //                     if (!xml.attributes.length) {
    //                         obj = escapeString(innerXml(xml));
    //                     } else {
    //                         obj["#text"] = escapeString(innerXml(xml));
    //                     }
    //                 }
    //             }
    //             // These statements get node values
    //             else if (countText > 0 || countCData > 0) {
    //                 if (!xml.hasAttributes()) {
    //                     obj = escapeString(innerXml(xml));
    //                 } else { //not sure if necess
    //                     obj["#text"] = escapeString(innerXml(xml));
    //                 }
    //             }
    //         } else if (!hasAttr) { //not a node & no attrs. Not sure if needed
    //             obj = null;
    //         }
    //     } else if (ptype === Node.DOCUMENT_NODE) {
    //         obj = toObj(xml.documentElement, keepRaw);
    //     } else if (!!(l = xml.length)) { //stupid iterator for arrays/nodelist
    //         obj = []; //evil type change
    //         for(i = 0; i < l; ++i) {
    //             node = toObj(xml[i]);
    //             obj.push(node);
    //         }
    //     } else {
    //         //return xml;
    //         throw ("Unhandled item " + xml);
    //     }

    //     return obj;
    // }

    // /* ************
    // *   ToObject Helpers
    // ***************/
    // function innerXml(node) {
    //     var s = "",
    //         c, i, l;

    //     if (s.innerHTML) {
    //         s = node.innerHTML;
    //     } else {
    //         for (i = 0, c = node.childNodes, l = c.length; i<l; ++i) {
    //             s += asXml(c[i]);
    //         }
    //     }
    //     return s;
    // }

    // function asXml(node) {
    //     var s = "",
    //         kid,
    //         attr, name,
    //         i, l;

    //     switch (node.nodeType) {
    //     case (Node.ELEMENT_NODE) :
    //         name = node.nodeName;
    //         s += "<" + name;
    //         for (i=0, l = node.attributes.length; i<l; ++i) {
    //             attr = node.attributes[i]
    //             s += " " + attr.nodeName + "=\"" + (attr.nodeValue||"").toString() + "\"";
    //         }

    //         if (!!(kid = node.firstChild)) {
    //             s += ">";
    //             for (; kid; kid=kid.nextSibling) {
    //                 s += asXml(kid);
    //             }
    //             s += "</" + name + ">";
    //         } else {
    //             s += "/>";
    //         }
    //         break;

    //     case (Node.TEXT_NODE) :
    //         s += node.nodeValue;
    //         break;

    //     case (Node.CDATA_SECTION_NODE) :
    //         s += "<![CDATA[" + node.nodeValue + "]]>";
    //         break;
    //     }

    //     return s;
    // }

    // function escapeString(txt) {
    //     return txt.replace(/[\\]/g, "\\\\")
    //                .replace(/[\"]/g, '\\"')
    //                .replace(/[\n]/g, '\\n')
    //                .replace(/[\r]/g, '\\r');
    // }

    // function removeWhite(node) {
    //     var kid,
    //         sib;
    //     node.normalize();

    //     for (kid = node.firstChild; kid; kid = sib) {
    //         sib = kid.nextSibling;
    //         switch(node.nodeType) {
    //         case (Node.TEXT_NODE) :
    //             if (!kid.nodeValue.match(notWhiteSpace)) { // pure whitespace text node
    //                 node.removeChild(kid);
    //             }
    //             break;
    //         case (Node.ELEMENT_NODE) :
    //             removeWhite(kid);
    //             break;
    //         }
    //     }
    //     return node;
    // }

    // function isPrimitive(arg) {
    //     var type = typeof arg;
    //     return !(arg) || (type !== "object" && type !== "function");
    // }


    /* ************
    *  End ToObject Helpers
    ***************/

    //namespacing
    (function() {
        var module = 'XML',
            _original = ns[module];

        ns[module] = CXML;

        CXML.destroy = function() {
            delete ns[module];
            ns[module] = _original;
        }
    })()
})(this.tf = this.tf || {}, document);