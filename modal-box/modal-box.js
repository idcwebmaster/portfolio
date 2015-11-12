YUI.add('modal-box', function (Y) {
	Y.ModalBox = Y.Base.create('modal-box', Y.Widget, [Y.WidgetPosition, Y.WidgetPositionAlign, Y.WidgetStack], {
		EVTHANDLES: [],
		initializer: function (config) {
			var mask = this.get('mask');
			if (mask) {
			    if(this.get('closeOnClick')){
			        mask.closeOnClick = this.get('closeOnClick');
			    }
			    console.info('Y.ModalBox ',this.get('closeOnClick'));
				this._mask = new Y.ModalMask(mask);
			}
			if(this.get('contentBox')){
                this.get('contentBox').appendTo(Y.one('body'));
            }
			this.get('boundingBox').setStyle('position','absolute');
			this.get('boundingBox').hide();
		},
		_hideMask: function (event) {
			this._mask.hide();
		},
		_onResize: function (event) {
			this.centered();
			if(this.get('contentBox')){ this.get('contentBox').centered(); }
		},
		_onCloseClick: function (event) {
			this.close();
		},
		_onMaskClose: function(){
            this.get('boundingBox').hide();
            this.fire('closed');
		},
		renderUI: function(){
			
		},
		bindUI: function () {
            if(this.get('contentBox')){
                this.EVTHANDLES.push( this.get('contentBox').delegate('click', Y.bind('_onCloseClick', this), '.close') );
                this.EVTHANDLES.push( Y.on('resize', this._onResize, this) );
                
            }
            if(this._mask){
                this.EVTHANDLES.push( this._mask.on('closed',this._onMaskClose,this) );
            }
		},
		syncUI: function () {
			console.log('Y.ModalBox->syncUI');
			var mask = this.get('mask');
			
			if (mask) {
				this._mask.render();
				this._mask.show();
				this.set('zIndex', this._mask.get('zIndex') + 1);
			}
			this.centered();
			this.get('contentBox').setStyles({
				display: 'block'
			});
			this.get('boundingBox').show();
		},
		close: function(){
		    this._mask.close();
		},
		destructor: function () {
		    this.fire('destroy');
            if(this.EVTHANDLERS){
                try{ Y.Array.each(this.EVTHANDLERS,function(_h){ _h.detach(); }); }catch(e){}
            }
			if (this._mask) {
				this._mask.destroy();
			}
			this.get('boundingBox').remove();
		}
	}, {
		ATTRS: {
			mask: {
				value: {
					color: '#000',
					opacity: 0.7,
					visible: false,
					zIndex: 10000
				},
				lazyAdd: false,
				writeOnce: true
			},
			closeOnClick: {value: false}
		}
	});

	
}, "3.3.0", {requires : [ 'base-build', 'base','widget','widget-position','widget-position-align','widget-stack','modal-mask']});