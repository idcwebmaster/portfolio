/**
 * An extension to the audio player which provide meta data display area.
 *
 * @module audio-player-display
 * @since 3.5.0
 */
YUI.add('audio-player-display', function(Y){
	var DISPLAY_TITLE = 'Now Playing';
	/**
     * An extension to the audio player which provide meta data display area.
     *
     * @class NFLAudioPlayerDisplay
     * @constructor
     * @extensionfor AudioPlayer
     * @since 3.5.0
     */
	function AudioPlayerDisplay(){
		// be careful not to conflict method name with other extensions
		Y.after(this._APD_afterRenderUI, this, 'renderUI');
	};
	
	AudioPlayerDisplay.ATTRS = {
		/**
         * channel title of the feed.
         * 
         * @attribute channelTitle
         * @type String
         */
		channelTitle: {},
		/**
         * title of audio clip.
         * 
         * @attribute title
         * @type String
         */
		title: {},
		/**
         * description of audio clip.
         * 
         * @attribute description
         * @type String
         */
		description: {}
	};
	
	AudioPlayerDisplay.prototype = {
		initializer: function (config) {
			this.set('strings', Y.merge({
				DISPLAY_TITLE: DISPLAY_TITLE
			}, config.strings || {}));
		},
		_APD_afterRenderUI: function(){
			var strings = this.get('strings'),
				display = this._createNode("display"),
				channelTitle = this.get('channelTitle'),
				title = this.get('title');
				
  			this.get("contentBox").append(display.append(Y.all([
  				this.buildNode({className: "message", content: strings.DISPLAY_TITLE}), 
  				this.buildNode({className: "channel-title", content: channelTitle}), 
  				this.buildNode({className: "title", content: title})
  			])));
  			
		}
	};
	
	Y.NFLAudioPlayerDisplay = AudioPlayerDisplay;
	
	
}, '3.5.0', {requires: ['oop']});