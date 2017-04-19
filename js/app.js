// *******************************
// *         DATA MODEL          *
// *******************************

var displaySearchResults = function(item) {
    this.name = ko.observable(item.venue.name);
    this.category = ko.observable(item.venue.categories[0].name);
    this.address = ko.observable(item.venue.location.formattedAddress);
    this.rating = ko.observable(item.venue.rating);
    this.imgSrc = ko.observable('https://irs0.4sqi.net/img/general/100x100' + item.venue.photos.groups[0].items[0].suffix);
}

// *******************************
// *         VIEW MODEL          *
// *******************************

var ViewModel = function() {
    var self = this;
    var Markers = [];
    self.placeList = ko.observableArray([]);
    this.defaultLocation = ko.observable("Paris");
    this.defaultThing = ko.observable("Restaurant");
    self.displayPlaces = ko.observable('true');
    var infoWindow = new google.maps.InfoWindow();

    function resetMarkers() {
		//remove all markers from map
		for (var i = 0; i < Markers.length; i++) {
			Markers[i].setMap(null);
		}
	}

    //Set google map boundry base on suggested boundry from FourSqure API

    function setMapBoundry(bounds_suggested) {
        if (typeof google !== "undefined") {
            // set bounds according to suggested bounds from foursquare
            var bounds_target = new google.maps.LatLngBounds(
                new google.maps.LatLng(bounds_suggested.sw.lat, bounds_suggested.sw.lng),
                new google.maps.LatLng(bounds_suggested.ne.lat, bounds_suggested.ne.lng));
            neighborMap.fitBounds(bounds_target);
            // center the map
            neighborMap.setCenter(bounds_target.getCenter());
        }

    }

    //Search function binded to search button
    self.searchPlaces = function() {
        var allPlaces = [];
        resetMarkers();
        self.placeList([]);

        var location = '&near=' + self.defaultLocation();
        var query = '&query=' + self.defaultThing();

        // API call to FourSquare
        var FourSquareAPIcall = 'https://api.foursquare.com/v2/venues/explore?' + '&client_id=MDCUBH3P5TBVVMRD241BF5CDUTGT4OIREG01OYDQNK14MX0Q' + '&client_secret= DCR5WAUEQTDAMT2I3EMFNQ0XDSQMNCWXEENTN4WQWHXOGEW1' + '&v=20150102&venuePhotos=1' + location + query;

        //Get json data from FourSqaure API
        $.getJSON(FourSquareAPIcall, function(data) {

            var places = data.response.groups[0].items;
            setMapBoundry(data.response.suggestedBounds)
            for (var i = 0; i < places.length; i++) {
                var item = places[i];
                // just add those items in list which has picture
                if (item.venue.photos.groups.length !== 0) {
                    self.placeList.push(new displaySearchResults(item));
                    allPlaces.push(item.venue);
                }
            }
            // sort the list based on ranking
            self.placeList.sort(function(left, right) {
                return left.rating() === right.rating() ? 0 : (left.rating() > right.rating() ? -1 : 1)
            });
            // create marker for all places on map
            pinPoster(allPlaces);
        }).error(function(e) {
            $('.side-display').hide()
			$('#load-error').html('<h4>Error : Bad Search, Please reload and try again!</h4>')
        });

    }

    self.searchPlaces();
    //Info Window
    function setInfoWindow(placeData, marker) {

        var address = placeData.location.address + ',' + placeData.location.city + ',' + placeData.location.country;
        var placeLink = placeData.url;
        var name = placeData.name;
        //loading street view photos
        var streetviewUrl = 'http://maps.googleapis.com/maps/api/streetview?size=200x110&location=' + address + '';
        //create new content
        var contentString = '<div class="info-container">' + '<div class="info-name">' + '<a href ="' + placeLink + '" target="_blank" >' + name + '</a>' + '</div>' + '</div>' + '<div class="address">' + address + '</div>' + '<img class="image-dp img-responsive img-thumbnail" src="' + streetviewUrl + '">' + '</div>';

        google.maps.event.addListener(marker, 'click', function() {
            infoWindow.setContent(contentString);
            infoWindow.open(neighborMap, marker);
        });
    }

    //Create marker with place data
    function createMapMarker(placeData) {

        var latitude = placeData.location.lat; //set latitude
        var longitude = placeData.location.lng; //set longitude
        var name = placeData.name; // name
        var pinImage = new google.maps.MarkerImage("http://icons.iconarchive.com/icons/icons-land/vista-map-markers/48/Map-Marker-Marker-Outside-Azure-icon.png"); //Pin icon by Icons

        if (typeof google !== "undefined") {
            var marker = new google.maps.Marker({
                map: neighborMap,
                icon: pinImage,
                position: new google.maps.LatLng(latitude, longitude),
                animation: google.maps.Animation.DROP,
                title: name
            });
            Markers.push(marker);
            setInfoWindow(placeData, marker)
        }


    }



    //create marker based on places received from api
    function pinPoster(Places) {
        // call createMapMarker for places
        for (var i in Places) {
            createMapMarker(Places[i]);
        }
    }

    //When list item clicked on UI then call this function
    self.focusMarker = function(venue) {
        var venueName = venue.name();
        for (var i = 0; i < Markers.length; i++) {
            if (Markers[i].title === venueName) {
                google.maps.event.trigger(Markers[i], 'click');
                neighborMap.panTo(Markers[i].position);
            }
        }

    }


};

// *******************************
// *         GOOGLE MAPS         *
// *******************************

var neighborMap;

function initMap() {
    //Styles by "Mike Fowler" Apple Maps-esque  -- snazzymaps
    var mapStyle = [{
        "featureType": "landscape.man_made",
        "elementType": "geometry",
        "stylers": [{
            "color": "#f7f1df"
        }]
    }, {
        "featureType": "landscape.natural",
        "elementType": "geometry",
        "stylers": [{
            "color": "#d0e3b4"
        }]
    }, {
        "featureType": "landscape.natural.terrain",
        "elementType": "geometry",
        "stylers": [{
            "visibility": "off"
        }]
    }, {
        "featureType": "poi",
        "elementType": "labels",
        "stylers": [{
            "visibility": "off"
        }]
    }, {
        "featureType": "poi.business",
        "elementType": "all",
        "stylers": [{
            "visibility": "off"
        }]
    }, {
        "featureType": "poi.medical",
        "elementType": "geometry",
        "stylers": [{
            "color": "#fbd3da"
        }]
    }, {
        "featureType": "poi.park",
        "elementType": "geometry",
        "stylers": [{
            "color": "#bde6ab"
        }]
    }, {
        "featureType": "road",
        "elementType": "geometry.stroke",
        "stylers": [{
            "visibility": "off"
        }]
    }, {
        "featureType": "road",
        "elementType": "labels",
        "stylers": [{
            "visibility": "off"
        }]
    }, {
        "featureType": "road.highway",
        "elementType": "geometry.fill",
        "stylers": [{
            "color": "#ffe15f"
        }]
    }, {
        "featureType": "road.highway",
        "elementType": "geometry.stroke",
        "stylers": [{
            "color": "#efd151"
        }]
    }, {
        "featureType": "road.arterial",
        "elementType": "geometry.fill",
        "stylers": [{
            "color": "#ffffff"
        }]
    }, {
        "featureType": "road.local",
        "elementType": "geometry.fill",
        "stylers": [{
            "color": "black"
        }]
    }, {
        "featureType": "transit.station.airport",
        "elementType": "geometry.fill",
        "stylers": [{
            "color": "#cfb2db"
        }]
    }, {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [{
            "color": "#a2daf2"
        }]
    }];
    var places;
    var mapOptions = {
        zoom: 16,
        disableDefaultUI: true,
        styles: mapStyle
    };
    var zoomAutocomplete = new google.maps.places.Autocomplete(
        document.getElementById('search-box-2'));
    neighborMap = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
    $('#map-canvas').height($(window).height());

    ko.applyBindings(new ViewModel());
}

// *******************************
// *        OTHER STUFF          *
// *******************************

$(document).ready(function() {
    var trigger = $('.hamburger'),
        overlay = $('.overlay'),
        isClosed = false;

    trigger.click(function() {
        hamburger_cross();
    });

    function hamburger_cross() {

        if (isClosed === true) {
            overlay.hide();
            trigger.removeClass('is-open');
            trigger.addClass('is-closed');
            isClosed = false;
        } else {
            overlay.show();
            trigger.removeClass('is-closed');
            trigger.addClass('is-open');
            isClosed = true;
        }
    }

    $('[data-toggle="offcanvas"]').click(function() {
        $('#wrapper').toggleClass('toggled');
    });
});

function errorHandling() {
    alert("Google Maps has failed to load. Please check your internet connection or url and try again.");
}