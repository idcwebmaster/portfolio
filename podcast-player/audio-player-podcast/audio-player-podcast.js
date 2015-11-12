/**
 * An Audio Player which provides full basic functionality of auido playback in podcast page.
 *
 * @module audio-player-podcast
 * @since 3.5.0
 */
YUI.add("audio-player-podcast", function (Y) {
	/**
     * An extension to the audio player which provide rewind, fast-forward, skip to start, ski to end and volume control.
     * When you need more granular player, break this down to smaller pieces.
     *
     * @class NFLAudioPlayerFull
     * @constructor
     * @uses NFLAudioPlayerDisplay
     * @uses NFLAudioPlayerControls
     * @uses NFLAudioPlayerDetails
     * @since 3.5.0
     */
	Y.NFLAudioPlayerPodcast = Y.Base.create("nflaudioplayerpodcast", Y.NFLAudioPlayer, [Y.NFLAudioPlayerDisplay, Y.NFLAudioPlayerControls, Y.NFLAudioPlayerDetails], {
		CONTENT_TEMPLATE: null
	});

}, "3.5.0", { 
	requires: ["base-build", "audio-player", "audio-player-display", "audio-player-controls", "audio-player-details", "font-endzonesans-condmedium"], 
	skinnable: true, 
	group: "nfl" 
});
