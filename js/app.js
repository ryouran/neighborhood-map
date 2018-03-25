'user strict';

var map;
var markers = [];

var initialLocations = [
	{
		title: 'Hello World Cafe',
		lat: 37.3135095,
		lng: -122.071365
	},
	{
		title: 'Bitter+Sweet',
		lat: 37.3181711, 
		lng: -122.0337107
	},
	{
		title: 'Cafe Lattea',
		lat: 37.3232226, 
		lng: -122.0145313
	},
	{
		title: 'Euphnet Cyber Cafe',
		lat: 37.350967,
		lng: -122.0495613
	},
	{
		title: 'Dolce Bella Chocolate Cafe',
		lat: 37.2935243, 
		lng: -121.9980892
	}
];

var Location = function(data){
	var self = this;
	this.lat = ko.observable(data.lat);
	this.lng = ko.observable(data.lng);
	this.title = ko.observable(data.title);
	this.show = ko.observable(true);

	// Create a marker per location
	var defaultIcon = makeMarkerIcon('00ced1');
	var highlightedIcon = makeMarkerIcon('f6546a');

	this.marker = new google.maps.Marker({
		map: map,
		position: new google.maps.LatLng(data.lat, data.lng),
		title: data.title,
		icon: defaultIcon,
		animation: google.maps.Animation.DROP
	});

	this.infoWindow = new google.maps.InfoWindow();

	populateInfoWindow(this.marker, this.infoWindow);


	// Show or hide markers depending on the filtered text
	this.showMarker = ko.computed(function() {
		var show = self.show() === true ? map : null;
		self.marker.setMap(show);
		return true;
	});

	// Add event listener to open an infowindow for each marker
	this.marker.addListener('click', function(){

		self.marker.setAnimation(google.maps.Animation.BOUNCE);
		setTimeout(function() {
			self.marker.setAnimation(null);
		}, 5000);

		populateInfoWindow(self.marker, self.infoWindow);

		self.infoWindow.open(map, this);

	});

	this.marker.addListener('mouseover', function(){
		self.marker.setIcon(highlightedIcon);
	});

	this.marker.addListener('mouseout', function(){
		self.marker.setIcon(defaultIcon);
	});

	markers.push(this.marker);

	// Allow only one marker for each infoWindow
	function populateInfoWindow(marker, infoWindow){

		if (infoWindow.marker != marker) {
			infoWindow.marker = marker;

			var clientId = "UE0NZOPTKCVW30QBVG5NTNOVJVVH3QWACI3MWVZTSZVFFBTX";
			var clientSecret = "GOIRIA2JANLTTFDJS50FJCTPI4XCGGJ51QUEUOBSIJLBRZL5";
			var lat = marker.getPosition().lat();
			var lng = marker.getPosition().lng();
			var url = 'https://api.foursquare.com/v2/venues/search?ll=' + lat + ',' + lng +
				'&client_id=' + clientId + '&client_secret=' + clientSecret +
				'&v=20170801&limit=1&query=' + marker.title;


		$.getJSON(url).done(function(data) {
			var results = data.response.venues[0];
			var address = results.location.formattedAddress[0] + '<br>' +
				" " + results.location.formattedAddress[1];
			var url = results.url;
			var name = results.name;
			infoWindow.setContent(
				'<div class="info-window"><div><a class="info-window-title" href="' +
				 url + '">' + name + '</a></div><div>' + address + '</div></div>');

		}).fail(function() {
			alert("Unable to load detailed information of the location. Please refresh the page and try again. " + 
				"If the problem persists, please try again later.");
		});

		// If the infoWindow is clicked, clear the marker and stop the animation
		infoWindow.addListener('closeclick', function(){
				infoWindow.marker = null;
				marker.setAnimation(null);
			});
		}
	
	}
	// Trigger click event to show the info window of the selected item in the search list
	this.showInfoWindow = function() {
        google.maps.event.trigger(self.marker, 'click');
    };
};


function makeMarkerIcon(markerColor) {
	var markerImage = new google.maps.MarkerImage(
		'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor +
		'|40|_|%E2%80%A2',
		new google.maps.Size(21, 34),
		new google.maps.Point(0, 0),
		new google.maps.Point(10, 34),
		new google.maps.Size(21, 34)
	);
	return markerImage;
}


var ViewModel = function() {
	var self = this;
	this.locationList = ko.observableArray([]);

	// Add each location model to the locationList
	initialLocations.forEach(function(loc){
		self.locationList.push( new Location(loc));
	});

	this.input = ko.observable("");

	this.toggle = ko.observable(true);

	// Show all locations which contain a provided filter text in the list
	this.searchList = ko.computed(function() {
		var input = self.input().toLowerCase();		
		if(input) {
			return ko.utils.arrayFilter(self.locationList(), function(loc) {
				var string = loc.title().toLowerCase();
				var result = (string.indexOf(input) !== -1);
				loc.show(result);
				return result;
			});
		} else {
			// Show all locations if no filter text is provided
			self.locationList().forEach(function(loc) {
				loc.show(true);
			});
			return self.locationList();
		}
	});


	// Show or hide the list of locations
	this.toggleList = function (toggle) {
		var list = document.getElementById("list");
		list.style.display = list.style.display == "none" ? "block" : "none";
	};

};

function initMap() {

	ko.applyBindings(new ViewModel());

	map = new google.maps.Map(document.getElementById('map'), {
		center: {lat: 37.3092448, lng: -122.078664},
		zoom: 12
	});

	// Extend bounds so all markers appear on the map
	bounds = new google.maps.LatLngBounds();
	
	markers.forEach(function(marker) {
		marker.setMap(map);
		bounds.extend(marker.position);
	});

	// Adjust bounds
	map.fitBounds(bounds);
}

function initMapError() {
	document.getElementById("map").innerHTML = "<div><p class=\"err-msg\">Unable to load a map. " + 
	"Please try again later.</p></div>";
}

