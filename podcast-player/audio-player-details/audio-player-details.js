/**
 * An extension to the audio player which provide the links to the audio information.
 *
 * @module audio-player-details
 * @since 3.5.0
 */
YUI.add('audio-player-details', function(Y){
	var DETAILS_FULL_LINK = 'link to Full Episode',
		DETAILS_DESCRIPTION = 'Description of Audio',
		DETAILS_FACEBOOK = 'facebook',
		DETAILS_ITUNES = 'itunes';
	/**
     * An extension to the audio player which provide the links to the audio information.
     * This is meant to be used along with NFLAudioPlayerControls.
     *
     * @class NFLAudioPlayerDetails
     * @constructor
     * @extensionfor AudioPlayer
     * @since 3.5.0
     */
	function AudioPlayerDetails(){
		// be careful not to conflict method name with other extensions
		Y.after(this._APDT_afterRenderUI, this, 'renderUI');
		Y.after(this._APDT_afterBindUI, this, 'bindUI');
		Y.after(this._APDT_afterDestructor, this, 'destructor');
	};
	
	AudioPlayerDetails.ATTRS = {
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
		description: {},
		/**
         * link of audio clip.
         * 
         * @attribute link
         * @type String
         */
		link: {},
		/**
         * thumbnail of audio clip.
         * 
         * @attribute thumbnail
         * @type String
         */
		thumbnail: {},
		/**
         * Full episode URL for the podcast.
         * 
         * @attribute episodeUrl
         * @type String
         */
		episodeUrl: {},
		/**
         * iTunes subscribe URL for audio clip.
         * 
         * @attribute subscribe
         * @type String
         */
		subscribe: {}
	};
	
	AudioPlayerDetails.prototype = {
		initializer: function (config) {
			this.set('strings', Y.merge({
				DETAILS_FULL_LINK: DETAILS_FULL_LINK,
				DETAILS_DESCRIPTION: DETAILS_DESCRIPTION,
				DETAILS_FACEBOOK: DETAILS_FACEBOOK,
				DETAILS_ITUNES: DETAILS_ITUNES
			}, config.strings || {}));
		},
		_APDT_afterRenderUI: function(){
			var strings = this.get('strings'),
				details = this._createNode("details").set("tabIndex", 0).setAttribute("aria-role", "button"),
				detailDropdown = this._createNode("details-dropdown"),
				share = this.buildNode({className: "details-dropdown-facebook", content: strings.DETAILS_FACEBOOK, template: '<a></a>'}),
				hasSubscribe = Y.Lang.isValue(this.get('subscribe')),
				itunesTpl = hasSubscribe ? '<a href="' + this.get('subscribe') + '" target="_blank"></a>' : '<span></span>',
				itunes = this.buildNode({className: "details-dropdown-itunes", content: strings.DETAILS_ITUNES, template: itunesTpl}).setStyle('opacity', hasSubscribe ? 1.0 : 0.5);
			
			detailDropdown.append(Y.all([
			    this.buildNode({className: "details-dropdown-description", content: strings.DETAILS_DESCRIPTION + this.get('description'), template: '<span></span>'}), 
				this.buildNode({className: "details-dropdown-fulllink", content: strings.DETAILS_FULL_LINK, template: '<a href="' + this.get('episodeUrl') + '"></a>'}), 
				share.append(this.buildNode({className: "details-dropdown-facebook-icon", template: '<span></span>'})),
				itunes.append(this.buildNode({className: "details-dropdown-itunes-icon", template: '<span></span>'}))
			]).addClass(this.getClassName("details-dropdown-item"))).addClass(this.getClassName("details-dropdown", "hidden"));
			
			this._controls.append(Y.all([details, detailDropdown]));
  			
			this._details = details;
  			this._detailDropdown = detailDropdown;
  			this._share = share;
		},
		_APDT_afterBindUI: function(){
			this._detailsClickHandler = this._details.on("click", this._afterDetailsClick, this);
			this._shareClickHandler = this._share.on("click", this._afterShareClick, this);
			nfl.loadFacebook(function(FB){
				console.log('FB ready', FB)
			});
		},
		_afterDetailsClick: function (event) {
			event.preventDefault();
			var hideClass = this.getClassName("details-dropdown", "hidden");
			this._detailDropdown.toggleClass(hideClass, !this._detailDropdown.hasClass(hideClass));
		},
		_afterShareClick: function (event) {
			event.preventDefault();
			var channelTitle = this.get('channelTitle'),
				title = this.get('title'),
				description = this.get('description'),
				link = this.get('link');
			description = Y.Node.create('<div></div>').set('innerHTML', description).get('text');
			FB.ui({
		    	method: 'stream.publish',
		    	display: 'popup',
		    	attachment: {
		    	  name: title,
		    	  description: description,
		    	  href: window.location.href,
		    	  media: [
	    	          {	type: 'mp3',
	    	        	src: this.get('url'),
	    	        	title: title,
		    	        artist: 'NFL Audio',
		    	        album: channelTitle
	    	          }
		    	  ]
		    	},
		    	action_links: [
		    	  { text: 'More NFL Podcasts', href: nfl.constants.SITE_URL + '/podcast' }
		    	]
		    }, function(response){
				if(response && response.post_id) {
					console.log('Post was published.');
				}else{
				    console.log('Post was not published.', response);
				}
			});
		},
		_APDT__afterDestructor: function(){
			if (this.get("rendered")) {
				this._detailsClickHandler.detach();
				this._shareClickHandler.detach();
			}
			this._detailsClickHandler = this._shareClickHandler = null;
		}
	};
	
	Y.NFLAudioPlayerDetails = AudioPlayerDetails;
	
}, '3.5.0', {requires: ['oop']});