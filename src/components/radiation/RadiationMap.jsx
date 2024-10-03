import { useState, useEffect, useRef } from "react";
import data from '../../assets/data/map.json';
import styles from '../../styles/radiation/radiation.module.css';
import gongdan from '../../assets/images/radiation/gongdan.svg';
import radiation from '../../assets/data/radiation.json';
import avgRadData from '../../assets/data/avgRad.json';
import gongdanImg from '../../assets/images/radiation/gongdanImg.svg';

export default function RadiationMap() {
    const [area, setArea] = useState([]);
    const [avgRad, setAvgRad] = useState([]);
    const [isClick, setIsClick] = useState(false); // 경주 지역 오버레이 클릭 여부
    const [map, setMap] = useState(null);
    const selectedPolygonRef = useRef(null); // useRef로 이전의 선택된 폴리곤 참조
    const initialPolygons = useRef([]);
    const polygonObjects = useRef([]); // 모든 폴리곤 객체를 저장하는 배열
    const gyeongjuPolygon = useRef(null);
    const polygonGroups = useRef({}); // 지역별로 폴리곤 그룹을 저장할 객체
    const customOverlayRef = useRef(null); // customOverlay를 ref로 선언하여 필요시 사용

    function focusGyeongju() {
        if (map) {
            // customOverlay가 존재하면 숨기기
            if (!customOverlayRef.current) {
                customOverlayRef.current = new window.kakao.maps.CustomOverlay({
                    zIndex: 1000,
                });
            } else {
                customOverlayRef.current.setMap(null);
            }
    
            if (map.getLevel() > 11 && isClick === false) {
                map.setLevel(11);
                map.setCenter(new window.kakao.maps.LatLng(35.85, 129.2545));
                polygonObjects.current.forEach(polygon => {
                    if (gyeongjuPolygon.current !== polygon) polygon.setOptions({ fillColor: "#004c80" });
                });
    
                gyeongjuPolygon.current.setOptions({ strokeColor: "#FF7676", strokeWeight: 5 });
    
                const gyeongjuData = area.find(item => item.properties.KOR_NM === "경주시");
                if (gyeongjuData) {
                    const content = `<div class=${styles.gyeongjuOverlay} style="position:relative; z-index:100; bottom:100px; padding:5px; width:120px; height:40px; background-color: rgba(255, 255, 255, 0.8);">
                                        <span>경주시</span>
                                        <div class=${styles.infoLine}></div>
                                        <span>${gyeongjuData.radiation} μSv/h</span>
                                    </div>`;
                    customOverlayRef.current.setContent(content);
                    customOverlayRef.current.setPosition(new window.kakao.maps.LatLng(35.8388735, 129.196647));
                    customOverlayRef.current.setMap(map);
                }
    
            } else if (map.getLevel() < 13 && isClick === true) {
                map.setLevel(13);
                map.setCenter(new window.kakao.maps.LatLng(35.7360, 127.8829));
                polygonObjects.current.forEach(polygonObj => {
                    const initialPolygon = initialPolygons.current.find(item => item.polygon === polygonObj);
                    if (initialPolygon) {
                        polygonObj.setOptions(initialPolygon.options);
                    }
                });
    
                gyeongjuPolygon.current.setOptions({ strokeColor: "#004c80", strokeWeight: 1 });
            }
        }
    }
    

    // 폴리곤 중심 좌표 계산 함수
    const getPolygonCenter = (coordinates) => {
        let sumLat = 0;
        let sumLng = 0;
        coordinates.forEach((coord) => {
            sumLat += coord.getLat();
            sumLng += coord.getLng();
        });
        return new window.kakao.maps.LatLng(sumLat / coordinates.length, sumLng / coordinates.length);
    };

    // 방사선 수치에 따른 색상 설정 함수
    const getColorByRadiation = (level, avgRad) => {
        
        if (level - avgRad < -0.023) return "#80FF32";
        else if (level - avgRad < -0.018) return "#75EA2D";
        else if (level - avgRad < -0.013) return "#66FF66";
        else if (level - avgRad < -0.008) return "#009900";
        else if (level - avgRad < 0.0973) return "#006600"; // 낮은 수치
        else if (level - avgRad < 0.973) return "#FFFF00"; // 중간 수치
        else if (level - avgRad < 973) return "#E68E27";
        else return "#FF0000"; // 높은 수치
    };

    useEffect(() => {
        // axios.get(`https://7k57mfcjca.execute-api.ap-northeast-2.amazonaws.com/default/recent_radiation_average`)
        //     .then(res=>{
        //         setAvgRad(res.data);
        //     })

        setAvgRad(avgRadData);

        // Kakao Maps API 로드 확인
        if (!window.kakao || !window.kakao.maps) {
            alert("Kakao maps API is not loaded");
            return;
        }

        // JSON 데이터로 area 설정
        const initialArea = data.features.map((item, index) => ({
            ...item,
            radiation: radiation[index]["μSv/h"] || 0, // 방사선 값 추가
        }));
        setArea(initialArea); // 초기화한 area를 설정
    }, []);

    useEffect(() => {
        if (!window.kakao || !window.kakao.maps || area.length === 0) return;

        const { kakao } = window;

        // 지도 초기 설정
        const container = document.getElementById("map");
        const options = {
            center: new kakao.maps.LatLng(35.7360, 127.8829),
            level: 13, // 지도의 확대 레벨
            scrollwheel: false, // 마우스 휠 확대/축소 비활성화
            disableDoubleClickZoom: true, // 더블 클릭 확대/축소 비활성화
            draggable: false
        };

        const newMap = new kakao.maps.Map(container, options);
        setMap(newMap); // 상태 업데이트
    }, [area]);

    useEffect(() => {
        if (!map||area.length===0|avgRad.length===0) return;
    
        const { kakao } = window;
    
        // 마커 설정
        const markerPosition = new kakao.maps.LatLng(35.8388735, 129.196647);
        const marker = new kakao.maps.Marker({
            position: markerPosition,
        });
        marker.setMap(map);
    
        const drawPolygons = () => {
            const customOverlay = new kakao.maps.CustomOverlay({
                zIndex: 1000,
                content: '<div style={{pointerEvents:"none"}}></div>',
            });
    
            area.forEach((area, index) => {
                area.geometry.coordinates.forEach((polygon) => {
                    const isGyeongju = area.properties.KOR_NM === "경주시";
    
                    const path = polygon.map((ring) =>
                        ring.map((coord) => new kakao.maps.LatLng(coord[1], coord[0]))
                    );
    
                    const polygonObj = new kakao.maps.Polygon({
                        map: map,
                        path: path,
                        strokeWeight: 1,
                        strokeColor: "#004c80",
                        strokeOpacity: 0.8,
                        fillColor: getColorByRadiation(area.radiation, avgRad[index].avgRad),
                        fillOpacity: 0.3,
                    });
    
                    if(isGyeongju) gyeongjuPolygon.current = polygonObj;
    
                    polygonObjects.current.push(polygonObj);
                    initialPolygons.current.push({
                        polygon: polygonObj,
                        options: {
                            strokeWeight: 1,
                            strokeColor: "#004c80",
                            strokeOpacity: 0.8,
                            fillColor: getColorByRadiation(area.radiation, avgRad[index].avgRad),
                            fillOpacity: 0.3,
                        }
                    });
    
                    // 지역 이름을 키로 폴리곤 그룹 저장
                    const regionName = area.properties.KOR_NM;
                    if (!polygonGroups.current[regionName]) {
                        polygonGroups.current[regionName] = [];
                    }
                    polygonGroups.current[regionName].push(polygonObj);
    
                    kakao.maps.event.addListener(polygonObj, "mouseover", function () {
                        const regionName = area.properties.KOR_NM;
                        polygonGroups.current[regionName].forEach((poly) => {
                            poly.setOptions({ fillColor: "#09f" });
                        });
                    });
    
                    kakao.maps.event.addListener(polygonObj, "mouseout", function () {
                        polygonObj.setOptions({
                            fillColor: getColorByRadiation(area.radiation, avgRad[index].avgRad),
                        });
                    });
    
                    kakao.maps.event.addListener(polygonObj, "click", function () {
                        if (selectedPolygonRef.current && selectedPolygonRef.current !== polygonObj) {
                            // 이전에 선택된 폴리곤 그룹 복원
                            const prevRegionName = selectedPolygonRef.current.regionName;
                            polygonGroups.current[prevRegionName].forEach((poly) => {
                                poly.setOptions({ strokeColor: "#004c80", strokeWeight: 1 });
                            });
                        }

                        // 클릭한 폴리곤이 속한 그룹 선택
                        const regionName = area.properties.KOR_NM;
                        polygonGroups.current[regionName].forEach((poly) => {
                            poly.setOptions({ strokeColor: "#FF7676", strokeWeight: 3, fillColor: getColorByRadiation(area.radiation, avgRad[index].avgRad) });
                        });
    
                        // 오버레이 업데이트
                        const content = `<div class=${styles.customOverlay} style="position:relative; z-index:100; top:60px; padding:5px; width:120px; height:40px; background-color: rgba(255, 255, 255, 0.8);">
                                            <span>${regionName}</span>
                                            <div class=${styles.infoLine}></div>
                                            <span>${area.radiation} μSv/h</span>
                                         </div>`;
                        customOverlay.setContent(content);
                        customOverlay.setPosition(getPolygonCenter(path[0]));
                        customOverlay.setMap(map);
    
                        customOverlayRef.current = customOverlay;
                        selectedPolygonRef.current = { polygon: polygonObj, regionName };
                    });
                });
            });
        };
    
        drawPolygons();
    }, [map, area, avgRad]);

    return (
        <div className={styles.map}>
            <div id="map" style={isClick?{width: "100%", height: "100%", pointerEvents:"none"}:{ width: "100%", height: "100%" }}>
                <div className={styles.notice}>
                    <div onClick={() => { 
                        setIsClick((state) => !state); focusGyeongju();}} className={isClick ? styles.clickPictogram : styles.pictogram}>
                        <img src={gongdan} alt="경주 방폐물처리장" />
                        <span>경주 방폐물처리장</span>
                    </div>
                </div>
            </div>
            {isClick ? (
                <div className={styles.gongdan}>
                    <img src={gongdanImg} alt="경주 방폐물처리장 이미지" />
                </div>
            ) : null}
        </div>
    );
}