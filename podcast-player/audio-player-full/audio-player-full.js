/**
 * An Audio Player which provides full basic functionality of auido playback.
 *
 * @module audio-player-full
 * @since 3.5.0
 */
YUI.add("audio-player-full", function (Y) {
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
	Y.NFLAudioPlayerFull = Y.Base.create("nflaudioplayerfull", Y.NFLAudioPlayer, [Y.NFLAudioPlayerDisplay, Y.NFLAudioPlayerControls, Y.NFLAudioPlayerDetails], {
		CONTENT_TEMPLATE: null
	});

}, "3.5.0", { 
	requires: ["base-build", "audio-player", "audio-player-display", "audio-player-controls", "audio-player-details", "font-endzonesans-condmedium"], 
	skinnable: true, 
	group: "nfl" 
});
