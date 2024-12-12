(
	function( $ ) {
		'use strict';

		window.dotinsights = window.dotinsights || {};
		dotinsights.Projects = dotinsights.Projects || {};
		dotinsights.Query = dotinsights.Query || {
			itemsPerPage: 3,
			maxNumPages: 1,
			page: 1,
			foundItems: 0
		};
		dotinsights.FilteredProjects = dotinsights.FilteredProjects || {};
		var Helpers = window.dotinsights.Helpers;

		var lastST = 0;
		var $window = $( window );
		var projectSortedCategories = {
			key_management: 10,
			account_abstraction: 20,
			wallet: 30,
			policies: 40,
			intents: 50,
			tooling: 60,
			mempools: 70,
			sequencing: 80,
			auctions: 90,
			orderflow: 100,
			private_computation: 110,
			routing: 120,
			last_look: 130,
			inventory: 140,
			oracles: 150,
			bridges: 160,
			pre_confirmation: 170,
			data_availability: 180,
			finality: 190,
			liquidity: 200,
			proofs: 210,
			execution: 220,
			application_layer: 230,
			uncategorized: 9999,
		};

		var $searchForm            = $( '#project-form-filter' ),
		    $searchSubmitBtn       = $searchForm.find( '.search-submit' ),
		    searchDelay            = 700,
		    searching              = null,
		    $projectCategoriesList = $( '#project-categories-list' ),
		    $buttonLoadmore        = $( '#btn-load-more-projects' );

		$( document.body ).on( 'dotinsights/EcosystemMap/Loaded', function() {
			initProjects();
		} );

		$searchForm.on( 'keyup', '.search-field', function() {
			clearTimeout( searching );
			searching = setTimeout( function() {
				$searchSubmitBtn.addClass( 'updating-icon' );

				setTimeout( function() {
					$searchSubmitBtn.removeClass( 'updating-icon' );
					$( document.body ).trigger( 'dotinsights/EcosystemMap/Searching' );
				}, 300 )
			}, searchDelay );
		} );

		$searchForm.on( 'submit', function( evt ) {
			clearTimeout( searching );
			searching = setTimeout( function() {
				$( document.body ).trigger( 'dotinsights/EcosystemMap/Searching' );
			}, searchDelay );

			return false;
		} );

		$( document.body ).on( 'dotinsights/EcosystemMap/Searching', function() {
			searchingProjects();
		} );

		$( document.body ).on( 'click', '.filter-item', function( evt ) {
			evt.preventDefault();

			var $thisButton = $( this );

			if ( $thisButton.hasClass( 'current' ) ) {
				return;
			}

			var cat = $( this ).data( 'cat' );
			$thisButton.siblings().removeClass( 'current' );
			$thisButton.addClass( 'current' );

			$searchForm.find( 'input[name="cat"]' ).val( cat );
			$searchForm.trigger( 'dotinsights/EcosystemMap/Searching' );
		} );

		$( document.body ).on( 'click', '#btn-load-more-projects', function( evt ) {
			evt.preventDefault();

			var $button = $( this );

			if ( dotinsights.Query.page < dotinsights.Query.maxNumPages ) {
				$buttonLoadmore.addClass( 'updating-icon' );
				setTimeout( function() {
					dotinsights.Query.page += 1;
					buildList( true );
					$buttonLoadmore.removeClass( 'updating-icon' );

					if ( dotinsights.Query.page === dotinsights.Query.maxNumPages ) {
						$button.hide();
					}
				}, 700 );
			}
		} );

		$window.on( 'scroll', function() {
			var currentST = $( this ).scrollTop();

			// Scroll down only.
			if ( currentST > lastST ) {
				var windowHeight = $window.height(),
				    // 90% window height.
				    halfWH       = parseInt( 90 / 100 * windowHeight ),
				    elOffsetTop  = $buttonLoadmore.offset().top,
				    elHeight     = $buttonLoadmore.outerHeight( true ),
				    offsetTop    = elOffsetTop + elHeight,
				    finalOffset  = offsetTop - halfWH;

				if ( currentST >= finalOffset ) {
					if ( ! $buttonLoadmore.hasClass( 'updating-icon' ) ) {
						$buttonLoadmore.trigger( 'click' );
					}
				}
			}

			lastST = currentST;
		} );

		function handlerListItemAnimation() {
			var $animations = $projectCategoriesList.find( '.tm-animation' );

			$animations.waypoint( function() {
				// Fix for different ver of waypoints plugin.
				var _self = this.element ? this.element : $( this );
				$( _self ).addClass( 'animate' );
			}, {
				offset: '100%' // triggerOnce: true
			} );
		}

		async function initProjects() {
			await sortAndGroup( dotinsights.Projects );
			buildFilters();
			buildList();
		}

		async function searchingProjects() {
			var searchTerm = $searchForm.find( 'input[name="s"]' ).val();
			var cat = $searchForm.find( 'input[name="cat"]' ).val();

			var rules = [];
			var terms = [];

			if ( '' !== searchTerm ) {
				terms.push( {
					key: 'project',
					value: searchTerm,
					operator: 'like'
				} );
			}

			if ( '' !== cat ) {
				terms.push( {
					key: 'category_slugs',
					value: cat,
					operator: 'in'
				} );
			}

			if ( terms.length > 0 ) {
				rules.push( {
					relation: 'and',
					terms: terms
				} );
			}

			var results = rules.length > 0 ? Helpers.filterByRules( rules, dotinsights.Projects ) : dotinsights.Projects;
			if ('' !== cat) {
				await sortAndGroup( results , cat );
			} else {
				await sortAndGroup( results );
			}
			buildList();
		}

		async function sortAndGroup( projects, forceGroupKey = undefined ) {
			function findCatLabel(catKey, fullCatLabel) {
				var catLabel = 'Uncategorized'
				fullCatLabel.split(',').map(x => x.trim()).forEach((label) => {
					if (Helpers.sanitizeKey(label) === catKey) {
						catLabel = label;
					}
				} );

				return catLabel
			}

			return new Promise( resolve => { // Sure sort and group completed.
				var results = [];

				if ( projects.length > 0 ) {
					var projectCategories = Helpers.groupByKeys( projects, 'category_slugs' );

					if ( forceGroupKey ) {
						projectCategories = { [ forceGroupKey ]: projectCategories[ forceGroupKey ] }
					}

					for ( var catKey in projectCategories ) {
						var _projects = projectCategories[ catKey ];

						_projects.sort( function ( a, b ) {
							return a.project.localeCompare(b.project);
						});

						var groupCat = {
							key: catKey,
							name: 'uncategorized' === catKey ? 'Uncategorized' : findCatLabel( catKey, projectCategories[ catKey ][ 0 ][ 'category' ] ),
							projects: _projects
						};

						groupCat.order = projectSortedCategories.hasOwnProperty( catKey ) ? projectSortedCategories[ catKey ] : 999;

						results.push( groupCat );
					}
				}

				// Sort by order.
				results = dotinsights.ArrayUtil.sortByKey( results, 'order', 'ASC' );
				var foundItems = results.length;
				dotinsights.FilteredProjects = results;
				dotinsights.Query.page = 1;
				dotinsights.Query.foundItems = foundItems;
				dotinsights.Query.maxNumPages = dotinsights.Query.itemsPerPage > 0 ? Math.ceil( foundItems / dotinsights.Query.itemsPerPage ) : 1;

				if ( dotinsights.Query.maxNumPages > 1 ) {
					$buttonLoadmore.show();
				} else {
					$buttonLoadmore.hide();
				}

				resolve( 'resolved' );
			} );
		}

		function buildFilters() {
			var allProjects = dotinsights.Projects.length;
			var $filterWrap = $( '#project-categories-filter' );
			var output = '<a href="#" data-cat="" class="current filter-item filter-all"><span class="filter-name">All projects</span><span class="filter-count">' + allProjects + '</span></a>';

			for ( var catIndex = 0; catIndex < dotinsights.FilteredProjects.length; catIndex ++ ) {
				var thisCat   = dotinsights.FilteredProjects[ catIndex ],
				    projects  = thisCat.projects,
				    itemClass = 'filter-item project-cat-color--' + thisCat.key;

				output += '<a href="#" data-cat="' + thisCat.key + '" class="' + itemClass + '">' + '<span class="filter-name">' + thisCat.name + '</span>' + '<span class="filter-count">' + projects.length + '</span></a>'
			}

			$filterWrap.html( output )
		}

		function buildList( append = false ) {
			var offset = (
				             dotinsights.Query.page - 1
			             ) * dotinsights.Query.itemsPerPage + 1,
			    getTo  = offset + dotinsights.Query.itemsPerPage,
			    output = '';

			getTo = getTo > dotinsights.Query.foundItems ? dotinsights.Query.foundItems + 1 : getTo;

			for ( var catIndex = offset; catIndex < getTo; catIndex ++ ) {
				var thisCategory     = dotinsights.FilteredProjects[ catIndex - 1 ],
				    projects         = thisCategory.projects,
				    catTotalProjects = projects.length,
				    catItemClass     = 'tm-animation fade-in-up cat-item cat-' + thisCategory.key,
				    catName          = '' !== thisCategory.name ? thisCategory.name : 'Others',
				    catHeadingClass  = 'project-category-name project-cat-color--' + thisCategory.key;

				output += '<div class="' + catItemClass + '"><h3 class="' + catHeadingClass + '">' + catName + '<span class="count">' + catTotalProjects + '</span></h3>';

				output += '<div class="projects-grid grid-modern" style="--grid-columns-desktop: 8; --grid-gutter-desktop: 20;--grid-columns-laptop: 7; --grid-columns-tablet-extra: 6; --grid-columns-tablet: 4; --grid-columns-mobile-extra: 3; --grid-columns-mobile: 2;">';
				for ( var i = 0; i < catTotalProjects; i ++ ) {
					var thisProject = projects[ i ];
					var thumbnailUrl = '../assets/images/projects/' + thisProject.project_slug + '.png';
					output += '<a href="' + thisProject.website + '" target="_blank" rel="nofollow" class="grid-item project-item">';
					output += '<div class="project-thumbnail"><img src="' + thumbnailUrl + '" alt="' + thisProject.project + '" width="80" height="80"/></div>';
					output += '<div class="project-info"><h3 class="project-name">' + thisProject.project + '</h3></div>';
					output += '</a>';
				}

				output += '</div></div>';
			}

			if ( append ) {
				$projectCategoriesList.append( output );
			} else {
				$projectCategoriesList.html( output );
			}

			handlerListItemAnimation();
		}
	}( jQuery )
);
