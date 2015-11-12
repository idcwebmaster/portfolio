/**
 * An extension to the audio player which provide rewind, fast-forward, skip to start, ski to end and volume control.
 * When you need more granular player, break this down to smaller pieces.
 *
 * @module audio-player-controls
 * @since 3.5.0
 */
YUI.add('audio-player-controls', function(Y){
	var win = Y.config.win,
		isTouch = ((win && ("ontouchstart" in win)) && !(Y.UA.chrome && Y.UA.chrome < 6) || nfl.constants.IS_MOBILE );
		console.log('isTouch:',isTouch);
	/**
     * An extension to the audio player which provide rewind, fast-forward, skip to start, ski to end and volume control.
     * When you need more granular player, break this down to smaller pieces.
     *
     * @class NFLAudioPlayerControls
     * @constructor
     * @extensionfor AudioPlayer
     * @since 3.5.0
     */
	function AudioPlayerControls(){
		Y.after(this._afterRenderUI, this, 'renderUI');
		Y.after(this._afterBindUI, this, 'bindUI');
		Y.after(this._afterSyncUI, this, 'syncUI');
		Y.after(this._afterDestructor, this, 'destructor');
		Y.after(this._afterAfterProgress, this, '_afterProgress');
	};
	
	AudioPlayerControls.ATTRS = {
		/**
         * an amount to skip for rewind and fast-forward.
         *
         * @attribute skipAmount
         * @default 10
         * @type Number
         */
		skipAmount: { value: 10 }
	};
	
	AudioPlayerControls.prototype = {
		initializer: function (config) {
		
		},
		_afterRenderUI: function(){
			var strings = this.get('strings'),
				controls = this._createNode("controls"),
				rw = this._createNode("rewind").set("tabIndex", 0).setAttribute("aria-role", "button"),
				start = this._createNode("skip-start").set("tabIndex", 0).setAttribute("aria-role", "button"),
				end = this._createNode("skip-end").set("tabIndex", 0).setAttribute("aria-role", "button"),
				ff = this._createNode("fastforward").set("tabIndex", 0).setAttribute("aria-role", "button"),
				stop = this._createNode("stop").set("tabIndex", 0).setAttribute("aria-role", "button"),
				volumeBtn = this._createNode("volume").set("tabIndex", 0).setAttribute("aria-role", "button"),
				volumeControl = this._createNode("volume-control"),
				volumeSlider = this._createNode("volume-slider"),
				volumeBar = this._createNode("volume-bar"),
				volumeNub = this._createNode("volume-nub"),
				
				nub = this._createNode("progress-nub").set("tabIndex", 0).setAttribute("aria-role", "button");
		
  			volumeControl.append(Y.all([
  				volumeSlider.append(Y.all([ volumeBar, volumeNub ]))
  			]));
  			
  			controls.append(Y.all([
  				this._playPause,
  				rw, start, end, ff, stop, volumeBtn, volumeControl,
  				this._time,
  				this._progress.append(Y.all([ this._loading, this._bar, nub ]))
  			]));
  			
  			this.get("contentBox").append(controls);
  			
  			this._controls = controls;
  			this._rewind = rw;
  			this._fastforward = ff;
  			this._skipStart = start;
  			this._skipEnd = end;
  			this._stop = stop;
  			this._volumeBtn = volumeBtn;
  			this._volumeControl = volumeControl;
  			this._volumeSlider = volumeSlider;
  			this._volumeBar = volumeBar;
  			this._volumeNub = volumeNub;
  			this._volumeNubHalfW  = Math.round(volumeNub.get("offsetWidth") / 2);
  			this._nub       = nub;
  			this._nubHalfW  = Math.round(nub.get("offsetWidth") / 2);
  			this._progressW = parseInt(this._progress.get("offsetWidth"));
  			this._volumeW = parseInt(volumeSlider.get("offsetWidth"));
  			// hide it after storing volume width
  			volumeControl.addClass(this.getClassName("volume-control", "hidden"));


  			// 
  			if (Y.SoundManager && Y.SoundManager.volumeNotSupported) {
  				this._volumeBtn.toggleClass("hidden", true);
  			}
		},
		_afterAfterProgress: function (event) {
			if (!this._isDragging) {
				this._setNubPosition(event.percentage);
			}
		},
		_afterSkipStartClick: function (event) {
			event.preventDefault();
			if(this._duration > 0){
				this._setPosition(0);
			}
		},
		_afterSkipEndClick: function (event) {
			event.preventDefault();
			if(this._duration > 0){
				this._setPosition(this._duration - 5 * 1000);
			}
		},
		_afterRewindClick: function (event) {
			event.preventDefault();
			if(this._duration > 0){
				this._setPosition(Math.max(0, this._curPosition - this.get('skipAmount') * 1000));
			}
		},
		_afterFastforwardClick: function (event) {
			event.preventDefault();
			if(this._duration > 0){
				this._setPosition(Math.min(this._duration, this._curPosition + this.get('skipAmount') * 1000));
			}
		},
		_afterStopClick: function (event) {
			event.preventDefault();
			if(this._s){
				this._s.stop();
			}
		},
		_afterVolumeClick: function (event) {
			event.preventDefault();
			var hideClass = this.getClassName("volume-control", "hidden");
			this._volumeControl.toggleClass(hideClass, !this._volumeControl.hasClass(hideClass));
		},
		_afterVolumeSliderClick: function (event) {
			event.preventDefault();
			var volume = this._volumeSlider,
				percentage = (event.pageX - volume.getX()) / volume.get("offsetWidth") * 100;
			this._setVolume(percentage);
		},
		_onVolumeNubDown: function (event) {
			event.halt();
			if (this._s) {
				this._isVolumeDragging = true;
				if(isTouch){
					this._volumeNubUpHandler = this._volumeNub.on("gesturemoveend", Y.bind("_onVolumeNubUp", this));
					this._volumeNubMoveHandler = this._volumeNub.on("gesturemove", Y.bind("_onVolumeNubMove", this));
				}else{
					this._volumeNubUpHandler = Y.delegate("mouseup", Y.bind("_onVolumeNubUp", this), '.'+this.getClassName('volume-control'), 'div');
					this._volumeNubMoveHandler = Y.delegate("mousemove", Y.bind("_onVolumeNubMove", this), '.'+this.getClassName('volume-control'), 'div');
				}
			}
		},
		_onVolumeNubUp: function (event) {
			this._isVolumeDragging = false;
			this._volumeNubUpHandler.detach();
			this._volumeNubMoveHandler.detach();
			this._volumeNubUpHandler = this._volumeNubMoveHandler = null;
			event.halt();
		},
		_onVolumeNubMove: function (event) {
			var volume = this._volumeSlider,
				percentage = (event.pageX - volume.getX()) / volume.get("offsetWidth") * 100;
			this._setVolume(percentage);
			event.halt();
		},
		_setVolumeNubPosition: function (percentage) {
			var l = Math.round(percentage / 100 * this._volumeW);
			l -= this._volumeNubHalfW;
			this._volumeNub.setStyle("left", l + "px");
		},
		_setVolumeBarPosition: function (percentage) {
			var realPercent = Math.round(percentage * 100) / 100;
			if (realPercent < 0) {
				realPercent = 0;
			}
			else if (realPercent > 100) {
				realPercent = 100;
			}
			this._volumeBar.setStyle("width", realPercent + "%");
		},
		_setNubPosition: function (percentage) {
			var l = Math.round(percentage / 100 * this._progressW);
			l -= this._nubHalfW;
			this._nub.setStyle("left", l + "px");
		},
		_onNubDown: function (event) {
			event.halt();
			if (this._s && this._duration > 0) {
				this._isDragging = true;
				if(isTouch){
					this._nubUpHandler = this._nub.on("gesturemoveend", Y.bind("_onNubUp", this));
					this._nubMoveHandler = this._nub.on("gesturemove", Y.bind("_onNubMove", this));
				}else{
					this._nubUpHandler = Y.delegate("mouseup", Y.bind("_onNubUp", this), this.get('boundingBox'), 'div');
					this._nubMoveHandler = Y.delegate("mousemove", Y.bind("_onNubMove", this), this.get('boundingBox'), 'div');
				}
			}
		},
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
			percentage = Math.min(100, Math.max(0, percentage));
			
			this._setNubPosition(percentage);
			this._setBarPosition(percentage);
			this._setTime(this._duration*percentage/100);
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
		_setVolume: function(value){
			value = Math.round(Math.max(0, Math.min(100, value)));
			
			if (this._s) {
				this._setVolumeNubPosition(value);
				this._setVolumeBarPosition(value);
				this._s.setVolume(value);
			}
			this._volume = value;
		},
		_afterBindUI: function(){
			var that = this;
			this._skipStartClickHandler = this._skipStart.on("click", this._afterSkipStartClick, this);
			this._skipEndClickHandler = this._skipEnd.on("click", this._afterSkipEndClick, this);
			this._rewindClickHandler = this._rewind.on("click", this._afterRewindClick, this);
			this._fastforwardClickHandler = this._fastforward.on("click", this._afterFastforwardClick, this);
			this._stopClickHandler = this._stop.on("click", this._afterStopClick, this);
			this._volumeClickHandler = this._volumeBtn.on("click", this._afterVolumeClick, this);
			this._volumeSliderClickHandler = this._volumeSlider.on("click", this._afterVolumeSliderClick, this);
			if(isTouch){
				Y.use('event-gestures', Y.bind(function(){
					this._volumeNubDownClickHandler = this._volumeNub.on("gesturemovestart", Y.bind(this._onVolumeNubDown, this));
				}, this));
			}else{
				this._volumeNubDownClickHandler = this._volumeNub.on("mousedown", this._onVolumeNubDown, this);
			}
			if(isTouch){
				Y.use('event-gestures', Y.bind(function(){
					this._nubDownHandler = this._nub.on("gesturemovestart", Y.bind(this._onNubDown, this));
				}, this));
			}else{
				this._nubDownHandler = this._nub.on("mousedown", this._onNubDown, this);
			}
			this._nubKeyUpHandler = this._nub.on("keyup", this._onNubKeyUp, this);
		},
		_afterSyncUI: function(){
			this._setNubPosition(0);
			this._setVolumeNubPosition(this.get('volume'));
			this._setVolumeBarPosition(this.get('volume'));
		},
		_afterDestructor: function(){
			if (this.get("rendered")) {
				this._afterSkipStartClick.detach();
				this._afterSkipEndClick.detach();
				this._afterRewindClick.detach();
				this._afterFastforwardClick.detach();
				this._stopClickHandler.detach();
				this._volumeClickHandler.detach();
				this._volumeSliderClickHandler.detach();
				this._volumeNubDownClickHandler.detach();
				
				this._nubDownHandler.detach();
			}
			this._nubDownHandler = this._nub = null;
			this._afterSkipStartClick = this._afterSkipEndClick = this._afterRewindClick = this._afterFastforwardClick = this._stopClickHandler = null;
			this._volumeClickHandler = this._volumeSliderClickHandler = this._volumeNubDownClickHandler = null;
		}
	};
	
	Y.NFLAudioPlayerControls = AudioPlayerControls;
	
}, '3.5.0', {requires: ['oop', 'event-delegate'], optional: ['event-gestures']});