import React, { Component } from "react";
import { Map, GoogleApiWrapper } from "google-maps-react";

class MapDisplay extends Component {
  state = {
    markers: []
  };


    /**
    * @description load map with markers
    */
    componentDidMount() {
      this.loadMap();
    };

    /**
     * @description destroy markers
     */
    componentWillUnmount() {
      this.state.markers.map(marker => marker.setMap(null));
      this.setState({marker: null});
      this.setState({ activeMarker: null });
    }

  componentWillReceiveProps = props => {
    // Change in the number of stops, so update the markers
    if (this.state.markers.length !== props.stops.length) {
      this.updateMarkers(props.stops);
      return;
    }

    // Treat the marker as clicked
    this.handleMarkerClick(
      this.state.markerInfo[props.clickedIndex],
      this.state.markers[props.clickedIndex]
    );
  };

  /**
  * @description load map and markers
  */
  loadMap = (props, map) => {
    this.setState({map});
    this.updateMarkers(this.props.stops);
  };

  /**
   * @description fetch Foursquare info when marker is clicked and assign to arrays for comparison and info window
   * @todo DRY & DOT
   */
  handleMarkerClick = (props, marker) => {
    //reusable variables
    const clientId = "WQ32QLRKJ3A5DNLFNXW50GFNR0S50YY2XN4EBFDYIJYLGSRO";
    const clientSecret = "JGCASHGL3FY3II1KYQNSBBWKOTOLZZPWGWZZZYTCINLODCMW";
    const hostName = "https://api.foursquare.com/v2/venues/";
    const version = "20181105";

    //search variables
    const searchPath = "search?";
    const searchUrl = new URL(searchPath, hostName);
    const param = {
      v: "20181104",
      ll: `${props.position.lat},${props.position.lng}`
    };
    let searchParam = new URLSearchParams(param);
    let url = `${searchUrl}client_id=${clientId}&client_secret=${clientSecret}&${searchParam}`;
    let headers = new Headers();
    let request = new Request(url, {
      method: "GET",
      headers
    });

    let fsInfo;
    fetch(request)
      .then(response => response.json())
      .then(data => {
        let destination = data.response.venues;
        fsInfo = {
          ...props,
          foursquare: destination[0]
        };

        if (fsInfo.foursquare) {
          let url = `${hostName}${
            destination[0].id
          }/photos?client_id=${clientId}&client_secret=${clientSecret}&v=${version}`;
          fetch(url)
            .then(response => response.json())
            .then(data => {
              fsInfo = {
                ...fsInfo,
                photos: data.response.photos
              };

              if (this.state.activeMarker)
                this.state.activeMarker.setAnimation(null);
              this.updateMarkerInfo(marker, fsInfo);
            });
        } else {
          this.updateMarkerInfo(marker, fsInfo);
        }
      });
  };

  /**
  *@description update marker state
  */
  updateMarkerInfo = (marker, fsInfo) => {
    marker.setAnimation(this.props.google.maps.Animation.BOUNCE);
    this.setState({
      activeMarker: marker,
      fsInfo
    });
  };

  /**
  *@description add and remove markers based on query
  *@tutorial Based on Doug Brown webinar
  */
  updateMarkers = stops => {
    this.state.markers.forEach(marker => marker.setMap(null));

    let markerInfo = [];
    let markers = stops.map((location, index) => {
      let info = {
        key: index,
        index,
        name: location.name,
        position: location.position
      };
      markerInfo.push(info);
      this.setState({ markerInfo});

      let marker = new this.props.google.maps.Marker({
        position: location.position,
        map: this.state.map,
        animation: this.props.google.maps.Animation.DROP
      });
      marker.addListener("click", () => {
        this.handleMarkerClick(info, marker, null);
      });
      return marker;
    });
    this.setState({ markers });
  };

  render() {
    const style = {
      width: "100%",
      height: "60vh"
    };
    const center = {
      lat: 33.60396,
      lng: -111.92579
    };
    let activeInfo = this.state.fsInfo;

    return (
      <Map
        role="application"
        aria-label="map"
        onReady={this.loadMap}
        google={this.props.google}
        zoom={9}
        style={style}
        initialCenter={center}
      >
      </Map>
    );
  };
}

export default GoogleApiWrapper({
  apiKey: "AIzaSyBSf2q0a4Umr65w17nKsfLOl6L99Vj2DsQ"
})(MapDisplay);