YUI.add('overthrow-shadows', function(Y){
	var globalEnv = YUI.namespace('Env.OverthrowShadow');
	Y.OverthrowShadows = Y.Base.create("overthrow-shadows", Y.Base, [], {

		initializer : function(){
			this._setOverthrow();
		},

		_setOverthrow : function() {
			/*
			ADD THIS CODE BACK IN WHEN CHECKED ON ANDROID,
			JUST NEED TO MAKE SURE IT WORKS WELL PERFORMANCE WISE
			if (!globalEnv.initialized) {
				Y.one('body').delegate('touchmove', this._checkBoundaries, '.overthrow');
				globalEnv.initialized = true;
			}*/

			if (this.ELEMS) {
				this.ELEMS.each(function (elem){
					elem.detach();
				});
	
				this.ELEMS = null;
			}

			this.ELEMS = Y.all('.overthrow');
			this.ELEMS.each(function (elem){
				this._checkBoundaries({currentTarget: elem});
				elem.on('scroll', this._checkBoundaries);
				elem.on('touchmove', this._checkBoundaries);
				elem.on('resize', this._checkBoundaries);
				elem.on('orientationchange', this._checkBoundaries);
				elem.on('MSPointerMove', this._checkBoundaries); 
			}, this);
		},

		/*
		use syncUI to update collection of elements on the page that listen for scroll
		example usage: 
		var overthrowShadows = new Y.OverthrowShadows();

		Y.one('body').append('<div class="overthrow"><div>');

		overthrowShadows.syncUI();	
		*/
		syncUI : function() {
			this._setOverthrow();
		},

		_checkBoundaries: function (e) {
			var el = e.currentTarget,
				elem = el._node,
				scrollWidth = parseInt(elem.scrollWidth, 10),
				scrollLeft = parseInt(elem.scrollLeft, 10),
				offsetWidth = parseInt(elem.offsetWidth, 10),
				offsetLeft = parseInt(elem.offsetLeft, 10);

			if (!el.ancestor()) {
				return false;
			}

			if ((scrollLeft + offsetWidth) > (scrollWidth - 10)) {
				el.removeClass('overthrow-shadows-right');
				el.ancestor().removeClass('overthrow-shadows-right');
			} else{
				if (!el.hasClass('overthrow-shadows-right')) {
					el.addClass('overthrow-shadows-right');
					el.ancestor().addClass('overthrow-shadows-right');
				}
			}

			if (scrollLeft < 10) {
				el.removeClass('overthrow-shadows-left');
				el.ancestor().removeClass('overthrow-shadows-left');
			} else{
				if (!el.hasClass('ovethrow-shadows-left')) {
					el.addClass('overthrow-shadows-left');
					el.ancestor().addClass('overthrow-shadows-left');
				}
			}
		}
	},{});
},'3.9.1',{requires:["base", "event", "event-touch", "node"]});

