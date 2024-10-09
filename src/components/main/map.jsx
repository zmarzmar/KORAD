import React, { useEffect } from 'react';

const Map = () => {
  useEffect(() => {
    const { kakao } = window;
    const container = document.getElementById('map'); 
    const options = {
      center: new kakao.maps.LatLng(35.8388735, 129.196647),
      level: 4, 
    };
    const map = new kakao.maps.Map(container, options); 
    const markerPosition = new kakao.maps.LatLng(35.8388735, 129.196647); 
    const marker = new kakao.maps.Marker({
      position: markerPosition,
    });
    marker.setMap(map); 


    const zoomControl = new kakao.maps.ZoomControl();
    map.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);

  }, []);

  return (
    <div
      id="map"
      style={{
        width: '90vw',
        height: '50vw',
        borderRadius: '10px',
        boxShadow: '0px 1px 5px rgba(0, 0, 0, 0.2)',
      }}
    ></div>
  );
};

export default Map;
