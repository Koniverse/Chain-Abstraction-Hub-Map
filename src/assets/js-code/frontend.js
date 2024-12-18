(
	function( $ ) {
		'use strict';

		var Helpers = abslayer.Helpers,
		    $window = $( window ),
		    $body   = $( document.body ),
		    wWidth  = window.innerWidth,
		    wHeight = window.innerHeight,
		    resizeTimer,
		    $header = $( '#header' );

		$window.on( 'resize', function() {
			if ( wWidth !== window.innerWidth ) {
				$window.trigger( 'hresize' );

				clearTimeout( resizeTimer );
				resizeTimer = setTimeout( function() {
					// Run code here, resizing has "stopped".
					$window.trigger( 'hresize_one' );
				}, 500 );
			}

			if ( wHeight !== window.innerHeight ) {
				$window.trigger( 'vresize' );
			}

			wWidth = window.innerWidth;
			wHeight = window.innerHeight;
		} );

		$window.on( 'scroll', function() {
			var currentST = $( this ).scrollTop();

			if ( currentST > 0 ) {
				$header.addClass( 'header-pinned' );
			} else {
				$header.removeClass( 'header-pinned' );
			}
		} );

		$( document ).ready( function() {
			scrollTo();
			initPartnerSlider();
			initGrids();
			initModal();
			handleNavigation();
		} );

		$( window ).on( 'load', function() {
			initSectionEffectSnow();

			$body.addClass( 'loaded' );

			setTimeout( function() {
				var $loader = $( '#page-preloader' );

				if ( $loader.length > 0 ) {
					$loader.remove();
				}
			}, 2000 );
		} );

		function handleNavigation() {
			var $nav        = $( '#primary-menu' ),
			    $navToggler = $( '#navbar-toggler' );

			$navToggler.on( 'click', function( evt ) {
				evt.preventDefault();

				$nav.toggleClass( 'opened' );
			} );

			$( document ).on( 'click', function( e ) {
				if ( $( e.target ).hasClass( 'navbar-toggler' ) ) {
					return;
				}

				if ( $( e.target ).closest( $nav ).length === 0 ) {
					$nav.removeClass( 'opened' );
				}
			} );
		}

		function initModal() {
			if ( $.fn.abslayerModal ) {
				$body.on( 'click', '[data-abslayer-toggle="modal"]', function( evt ) {
					evt.preventDefault();
					var $target = $( $( this ).data( 'abslayer-target' ) );

					if ( $target.length > 0 ) {
						if ( $( this ).attr( 'data-abslayer-dismiss' ) === '1' ) {
							$target.abslayerModal( 'close' );
						} else {
							$target.abslayerModal( 'open' );
						}
					}
				} );
			}
		}

		function scrollTo() {
			$( document.body ).on( 'click', '.scroll-to', function( evt ) {
				evt.preventDefault();
				const target = $( this ).attr( 'href' );
				const offsetTop = $( target ).offset().top;

				window.scroll( {
					top: offsetTop - 30 - 80,
					left: 0,
					behavior: 'smooth'
				} )
			} )
		}

		// function initSliders() {
		// 	if ( $.fn.SubwalletSwiper ) {
		// 		$( '.tm-swiper' ).each( function() {
		// 			$( this ).SubwalletSwiper();
		// 		} );
		// 	}
		// }

		// todo: may use SubwalletSwiper instead, if understand how it works
		function initPartnerSlider() {
			const partnerSlider = $( this ).find( '#partner-slider' );

			if ( partnerSlider ) {
				const swiper = new Swiper("#partner-slider", {
					slidesPerView: 1,
					loop: true,
					autoplay: {
						delay: 3000,
					},
					breakpoints: {
						576: {
							slidesPerView: 1,
						},
						768: {
							slidesPerView: 2,
						},
						1200: {
							slidesPerView: 3,
						},
						1600: {
							slidesPerView: 4,
						}
					}
				});
			}
		}

		function initGrids() {
			if ( $.fn.SubwalletGridLayout ) {
				$( '.block-grid' ).SubwalletGridLayout();
			}
		}

		function initSectionEffectSnow() {
			if ( ! $.firefly ) {
				return;
			}

			$( '.section-effect-snow' ).each( function() {
				var $thisSection = $( this );

				var total = $thisSection.data( 'firefly-total' ) ? $thisSection.data( 'firefly-total' ) : 50;

				var minPixel = Helpers.isHandheld() ? 2 : 3;
				var maxPixel = Helpers.isHandheld() ? 3 : 4;

				var settings = {
					color: 'rgba(255,255,255,0.3)',
					minPixel: minPixel,
					maxPixel: maxPixel,
					total: total,
					on: $thisSection,
					zIndex: 0,
				};

				$.firefly( settings );
			} );
		}

	}( jQuery )
);
