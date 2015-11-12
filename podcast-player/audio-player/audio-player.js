YUI.add("audio-player", function (Y) {
	var floor = Math.floor;
	
	function zeroPad(n) {
		return (Number(n) < 10 ? "0" : "") + n;
	}

	function parseTimeCode(code) {
		var m, response,
			s = floor(code / 1000),
			h = floor(s / 3600);
		
		s -= h * 3600;
		m = floor(s / 60);
		s -= m * 60;
		
		var response = {
			h: h,
			m: m,
			s: s
		};
		//console.log(code, response);
		return response;
	}
	
	function formatTime(obj, includeHours) {
		return (includeHours ? [obj.h, zeroPad(obj.m), zeroPad(obj.s)] : [obj.m, zeroPad(obj.s)]).join(":");
	}

	Y.NFLAudioPlayer = Y.Base.create("nflaudioplayer", Y.Widget, [Y.WidgetNodeBuilder], {
		/*CONTENT_TEMPLATE: null,*/
		_volume: 100,
		initializer: function () {
			Y.Array.each(["loadprogress", "progress", "finish", "play", "resume", "pause", "stop"], function(event){
				this.publish(event, { emitFacade: true, broadcast: 2 });
			}, this);
			this._isDragging = false;
			this._duration = 0;
			this._durationObject = { h: 0, m: 0, s: 0 };

			// adding a property to SoundManager to test volume-controls availability
			if (Y.SoundManager.hasHTML5 && !Y.SoundManager.hasOwnProperty("volumeNotSupported")) {
				var audioTest = document.createElement("audio");
				audioTest.volume = 0.8;
				Y.SoundManager.volumeNotSupported = (audioTest.volume !== 0.8);
			}
		},
		_createNode: function (className, template) {
			return this.buildNode({className: className, template: template});
		},
		renderUI: function () {
			var playPause = this._createNode("playpause").set("tabIndex", 0).setAttribute("aria-role", "button"),
				progress = this._createNode("progress"),
				loading = this._createNode("progress-loading"),
				bar = this._createNode("progress-bar"),
				//nub = this._createNode("progress-nub").set("tabIndex", 0).setAttribute("aria-role", "button"),
				time = this._createNode("time"),
				linkWrap;
			
			if (Modernizr.audio.mp3.length > 0 || parseInt(Y.SWFDetect.getFlashVersion(), 10) > 8) {
				this.get("contentBox").setStyle("visibility", "hidden").append(Y.all([
					playPause.append(this._createNode("playpause-icon")),
					progress.append(Y.all([ loading, bar, /*nub,*/ time ]))
				]));
				
				this._playPause = playPause;
				this._progress  = progress;
				this._loading   = loading;
				this._bar       = bar;
				this._time      = time;
				//this._nub       = nub;
				//this._nubHalfW  = Math.round(nub.get("offsetWidth") / 2);
			} else {
				linkWrap = this._createNode("link-wrap", '<a href="' + this.get('url') + '" target="_blank"></a>');
				linkWrap.append(playPause.append(this._createNode("playpause-icon")))
				this.get("contentBox").append(linkWrap);
				this.syncUI = function(){};
				this.bindUI = function(){};
			}
		},
		_onSoundLoading: function () {
			var s  = this._s,
				bl = s.bytesLoaded,
				bt = s.bytesTotal;
			
			this.fire("loadprogress", {
				bytesLoaded: bl,
				bytesTotal: bt,
				percentage: bl / bt * 100
			});
		},
		_onSoundProgress: function () {
			var s  = this._s;
			
			this.fire("progress", {
				position: s.position,
				duration: s.duration,
				percentage: s.position / s.duration * 100
			});
		},
		_onSoundStop: function () {
			this.set("playing", false);
			this._setBarPosition(0);
			this._setNubPosition(0);
			this._setLoadPosition(0);
			this._setTime(0);
			this.set("opened", false);
			this.fire("stop");
		},
		_onSoundFinish: function () {
			this.set("playing", false);
			this._setBarPosition(0);
			this._setNubPosition(0);
			this._setLoadPosition(0);
			this._setTime(0);
			this.set("opened", false);
			this.fire("finish");
		},
		_setPlaying: function (event, playing) {
			this.get("boundingBox")[playing ? "addClass" : "removeClass"](this.getClassName("playing"));
		},
		_afterLoadProgress: function (event) {
			this._setLoadPosition(event.percentage);
		},
		/*
		_setNubPosition: function (percentage) {
			var l = Math.round(percentage / 100 * this._progressW);
			if (l - this._nubHalfW < 0) {
				l = this._nubHalfW;
			}
			else if (l + this._nubHalfW > this._progressW) {
				l = this._progressW - this._nubHalfW;
			}
			this._nub.setStyle("left", l + "px");
		},
		*/
		_setBarPosition: function (percentage) {
			var realPercent = Math.round(percentage * 100) / 100;
			if (realPercent < 0) {
				realPercent = 0;
			}
			else if (realPercent > 100) {
				realPercent = 100;
			}
			this._bar.setStyle("width", realPercent + "%");
		},
		_setLoadPosition: function (percentage) {
			var realPercent = Math.round(percentage * 100) / 100;
			if (realPercent < 0) {
				realPercent = 0;
			}
			else if (realPercent > 100) {
				realPercent = 100;
			}
			this._loading.setStyle("width", realPercent + "%");
		},
		_afterProgress: function (event) {
			var d = this._duration, durObj = this._durationObject, time;
			
			if (d !== event.duration && Y.Lang.isNumber(event.duration)) {
				d      = this._duration = event.duration;
				durObj = this._durationObject = parseTimeCode(d);
			}
			this._curPosition = event.position;
			
			if (!this._isDragging) {
				this._setTime(event.position);
				this._setBarPosition(event.percentage);
				// this._setNubPosition(event.percentage);
			}
		},
		_afterPlayingChange: function (event) {
			var s = this._s,
				playing = event.newVal;

			// update the display
			this.get("boundingBox")[playing ? "addClass" : "removeClass"](this.getClassName("playing"));
			
			// start playback
			if (s && playing) {
				s.resume();
				if (! this.get("opened")) {
					this.set("opened", true);
				}
				this.fire("resume");
			}
			else if (s && s.playState === 0) {
				this._s.destruct();
				this._s = null;
			}
			else if (s) {
				s.pause();
				this.fire("pause");
			}
			else {
				this._sid = Y.guid();
				s = Y.SoundManager.createSound({
			    	id: this._sid,
			    	url: this.get("url"),
			    	volume: this.get('volume'),
			    	autoLoad: true,
			    	autoPlay: true,
					whileloading: Y.bind("_onSoundLoading", this),
					whileplaying: Y.bind("_onSoundProgress", this),
					onstop: Y.bind("_onSoundStop", this),
					onfinish: Y.bind("_onSoundFinish", this)
			    });
				this._s = s;
				this.set("opened", true);
				
				this.fire("play");
			}
		},
		_afterPlayPauseClick: function (event) {
			event.preventDefault();
			this.set("playing", ! this.get("playing"));
		},
		_afterProgressClick: function (event) {
			var progress;
			if (this._s && this._duration > 0) {
				progress = this._progress;
				this._setPosition((event.pageX - progress.getX()) / progress.get("offsetWidth") * this._duration);
			}
		},
		_onNubDown: function (event) {
			event.halt();
			if (this._s) {
				this._isDragging = true;
				this._nubUpHandler = Y.on("mouseup", Y.bind("_onNubUp", this));
				this._nubMoveHandler = Y.on("mousemove", Y.bind("_onNubMove", this));
			}
		},
		/*
		_onNubUp: function (event) {
			var progress = this._progress;
			
			this._isDragging = false;
			this._nubUpHandler.detach();
			this._nubMoveHandler.detach();
			this._nubUpHandler = this._nubMoveHandler = null;
			this._setPosition((event.pageX - progress.getX()) / progress.get("offsetWidth") * this._duration);
			event.halt();
		},
		_onNubMove: function (event) {
			var progress = this._progress,
				percentage = (event.pageX - progress.getX()) / progress.get("offsetWidth") * 100;
			this._setNubPosition(percentage);
			this._setBarPosition(percentage);
			event.halt();
		},
		_onNubKeyUp: function (event) {
			switch (event.button) {
			case 39:
				this.set("position", this.get("position") + 10 * 1000);
				break;
			case 37:
				this.set("position", this.get("position") - 10 * 1000);
				break;
			}
		},
		*/
		_getPosition: function (value) {
			return this._s ? this._s.position : 0;
		},
		
		_setPosition: function (value) {
			var pos = value;
			if (this._s) {
				if (pos < 0) {
					pos = 0;
				}
				else if (pos > this._duration) {
					pos = this._duration;
				}
				this._s.setPosition(Math.round(pos));
			}
		},
		_setTime: function(value) {
			// HTML5 audio often doesn't return duration
			var d = this._duration, durObj = this._durationObject, time = formatTime(parseTimeCode(value), !d ? true : durObj.h);
			if(d) time = time + " / " + formatTime(durObj, durObj.h);
			this._time.setContent(time);
		},
		_afterOpenedChange: function (event) {
			this.get("boundingBox")[event.newVal ? "addClass" : "removeClass"](this.getClassName("opened"));
		},
		bindUI: function () {
			this._playPauseClickHandler = this._playPause.on("click", this._afterPlayPauseClick, this);
			this._progressClickHandler = this._progress.on("click", this._afterProgressClick, this);
			// this._nubDownHandler = this._nub.on("mousedown", this._onNubDown, this);
			// this._nubKeyUpHandler = this._nub.on("keyup", this._onNubKeyUp, this);
			this.after("playingChange", this._afterPlayingChange, this);
			this.after("loadprogress", this._afterLoadProgress, this);
			this.after("progress", this._afterProgress, this);
			this.after("openedChange", this._afterOpenedChange, this);
		},
		syncUI: function () {
			this._setBarPosition(0);
			// this._setNubPosition(0);
			this._setLoadPosition(0);
			try{
				Y.SoundManager.onready(Y.bind(function () {
					this.get("contentBox").setStyle("visibility", "visible");
					if (this.get("autoStart")) {
						this.set("playing", true);
					}
				}, this));
			}catch(e){
				console.log(e)				
			}
		},
		destructor: function () {
			if (this._s) {
				this._s.destruct();
			}
			if (this.get("rendered")) {
				this._playPauseClickHandler.detach();
				// this._nubDownHandler.detach();
			}
			this._playPauseClickHandler = /*this._nubDownHandler =*/ this._playPause = this._progress = this._loading = this._bar = /*this._nub =*/ this._s = null;
		}
	}, {
		ATTRS: {
			url: {
				value: null
			},
			volume: {
				getter: function(){return this._volume;},
				setter: function(value){this._volume = value; return value;},
				validator: function(value){return Y.Lang.isNumber(value) && value >= 0 && value <= 100;}
			},
			opened: {
				value: false
			},
			playing: {
				value: false
			},
			position: {
				getter: "_getPosition",
				setter: "_setPosition"
			},
			autoStart: {
				value: false
			}
		}
	});

}, "3.3.0", { requires: ["base-build", "soundmanager", "widget", "transition", "node-screen", "widget-node-builder"], skinnable: true, group: "nfl" });
