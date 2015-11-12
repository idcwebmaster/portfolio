/*global YUI,nfl*/

/**
 * Retrieves a geo-specific string based on the provided identifier.
 * Example usage:
 *
 *   nfl.use("geocode", function(Y) {
 *     Y.getNFLGeoCode("foo", function (result) { console.log(result); });
 *   });
 */
YUI.add("geocode", function (Y) {
    "use strict";
    
    var PREFIX = "geocode:",
        YLang = Y.Lang,
        NFLGeoCode = Y.NFLGeoCode = function () {
            this.initialize.apply(this, arguments);
        }, instance;
        
    if(typeof YUI.Env.Geo === 'undefined'){
        YUI.Env.Geo = {};
    }
        
    NFLGeoCode.prototype = {
        check: function (uri) {
            var evtName = PREFIX + uri;
            if (YLang.isNull(this.getEvent(evtName, true))) {
                this.publish(evtName, {
                    emitFacade: true,
                    broadcast: 2,
                    fireOnce: true,
                    async: true
                });
        // if fetching data via JSONP
        if (this.config.useJSONP) {
          var jsonpUrl = nfl.constants.SITE_URL + "/widget/geocode?uri="+uri+"&callback=YUI.Env.Geo.nflGeoCodeCallback";
          YUI.Env.Geo.nflGeoCodeCallback = Y.bind(function(_resp){
              var evtName = PREFIX + uri;
              this.fire(evtName, { result: _resp });
              //console.log(' called YUI.Env.Geo.nflGeoCallbackStack function..',_resp);
          },this);
          var service = new Y.JSONPRequest(jsonpUrl, YUI.Env.Geo.nflGeoCodeCallback);
          service.send();
        } 
        // otherwise fetching data via AJAX
        else {
                Y.io("/widget/geocode", {
                    data: "uri=" + encodeURIComponent(uri),
                    context: this,
                    on: {
                        complete: function (id, xhr) {
                            this.fire(evtName, { result: xhr.responseText });
                        }
                    }
                });               
        }
            }
        },
        initialize: function (config) {
          this.config = config;
            if (config && config.uri) {
                this.check(config.uri);
            }
        }
    };

    Y.augment(NFLGeoCode, Y.EventTarget);
    
    Y.getNFLGeoCode = function (uri, callback, useJSONP) {
      var config = { useJSONP : useJSONP || false };
        instance = instance || new NFLGeoCode(config);
        instance.check(uri);
        if (YLang.isFunction(callback)) {
            /* 
             * event will be published automatically when start listening, so
             * need to call 'check' method first so that getEvent() returns null
             * also the event is set to fire once, so it's ok to listen after the event is fired.
             */
            instance.on(PREFIX + uri, function (event) {
                callback(event.result);
            });
        }
    };
    
    Y.getNFLGeoCountryCode = function(uri, callback, useJSONP){
        //console.log('Y.getNFLGeoCountryCode: '+uri,callback);
        if(sessionStorage !== null){
            var _cc = false;
            try{ _cc = sessionStorage['nflgeo_cc']; }catch(e){}
            if(_cc){
                //console.log('Y.getNFLGeoCountryCode: has local storage value: '+_cc);
                callback(_cc);
                return
            }
        }
        Y.getNFLGeoCode(uri, Y.bind(function(_cb,_r){
            // store country code on local storage
            var _cc = 'US';
            if(_r){
                //console.log('response type: ',typeof _r);
                var geo = ((typeof _r === 'string') ? Y.JSON.parse(_r) : _r); //Y.JSON.parse(_r);
                _cc = (typeof geo.countryCode !== 'undefined' && geo.countryCode !== null) ? geo.countryCode : _cc;
                //console.log('Y.getNFLGeoCountryCode: no local storage, got value from geo api: '+_cc);
                if(sessionStorage !== null){ try{ sessionStorage['nflgeo_cc'] = _cc ; }catch(e){}; }
            }
            // execute call back
            _cb(_cc);
        },window, callback), useJSONP);
    }
    
}, "3.3.0", { requires: ["io", "event-custom", "jsonp"] });
