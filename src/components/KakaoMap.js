import React, { useEffect, useRef, useState, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { apartments } from '../data/apartments';

const Layout = styled.div`
  display: flex;
  width: 100%;
  min-height: 500px;
  gap: 24px;
`;

const LeftPanel = styled.div`
  flex: 0 0 320px;
  background: #f9f9f9;
  border-radius: 8px;
  padding: 24px 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
  display: flex;
  flex-direction: column;
  min-width: 260px;
  height: 100vh; /* 높이 고정 */
`;

const SearchRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
`;

const SearchInput = styled.input`
  flex: 1 1 0;
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #ddd;
  font-size: 16px;
  min-width: 0;
`;

const SearchButton = styled.button`
  padding: 0 18px;
  border-radius: 5px;
  border: none;
  background: #007bff;
  color: white;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s;
  &:hover {
    background: #0056b3;
  }
`;

const MapContainer = styled.div`
  flex: 1 1 0;
  height: 100vh; /* 화면 전체 높이 */
  border-radius: 8px;
  overflow: hidden;
  background-color: hsl(99, 100.00%, 97.30%);
`;

const ResultList = styled.ul`
  margin-top: 10px;
  padding: 0;
  list-style: none;
  flex: 1 1 0;
  overflow-y: auto;
`;

const ResultItem = styled.li`
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  margin-bottom: 10px;
  background-color: #fff;
  cursor: pointer;
  font-size: 15px;

  &:hover {
    background-color: #e6f0ff;
  }
`;

const Layer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const LayerContent = styled.div`
  background: white;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

  p {
    margin-bottom: 20px;
    font-size: 16px;
    color: #333;
  }

  button {
    padding: 10px 20px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;

    &:hover {
      background: #0056b3;
    }
  }
`;

const KakaoMap = () => {
  const [address, setAddress] = useState('');
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [results, setResults] = useState([]);
  const [showLayer, setShowLayer] = useState(false);
  const [layerMessage, setLayerMessage] = useState('');
  const apartmentMarkers = useRef([]);
  const apartmentOverlays = useRef([]);
  const [searchMarkers, setSearchMarkers] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [infoOverlay, setInfoOverlay] = useState(null);
  const infoOverlayRef = useRef(null);
  const navigate = useNavigate();

  const initMap = useCallback(() => {
    if (!mapRef.current || !window.kakao?.maps) return;

    // 지도 인스턴스 생성 (최초 1회)
    if (!mapInstance.current) {
      const options = {
        center: new window.kakao.maps.LatLng(37.566826, 126.9786567),
        level: 3,
      };
      mapInstance.current = new window.kakao.maps.Map(mapRef.current, options);

      // 아파트 마커/오버레이 최초 1회만 생성
      apartments.forEach(apart => {
        const position = new window.kakao.maps.LatLng(apart.lat, apart.lng);

        // 1. window에 콜백 등록
        window[`showAptInfo_${apart.aptcd}`] = async () => {
          try {
            const res = await fetch(`https://apis.data.go.kr/1613000/AptBasisInfoServiceV3/getAphusBassInfoV3?serviceKey=afU4m%2B7JcibSN7X1GwOWD0ngqwoVtvLMDdTHOwvlUqU6xGT%2BW%2BaGSWk008eVs0xRCLCJp7ksdbvk4qzOEwfMPQ%3D%3D&kaptCode=${apart.aptcd}`);
            if (!res.ok) throw new Error('정보를 불러올 수 없습니다.');
            const data = await res.json();
            const item = data.response?.body?.item;
            if (!item) throw new Error('정보 없음');

            // 준공일자 yyyy.MM.DD 형식 변환
            let usedate = item.kaptUsedate;
            let usedateStr = '';
            if (usedate && usedate.length === 8) {
              usedateStr = `${usedate.slice(0,4)}.${usedate.slice(4,6)}.${usedate.slice(6,8)}`;
            }

            // 주소에서 아파트명 제거
            let displayAddr = item.kaptAddr;
            if (item.kaptAddr && item.kaptName && item.kaptAddr.includes(item.kaptName)) {
              displayAddr = item.kaptAddr.replace(item.kaptName, '').replace(/\s+/g, ' ').trim();
            }

            // 기존 정보창 오버레이 제거
            if (infoOverlayRef.current) infoOverlayRef.current.setMap(null);

            // 정보창 오버레이 생성
            const infoContent = `
              <div class="apt-info-overlay" style="background:#fff;border:1px solid #007bff;border-radius:8px;padding:16px;min-width:240px;box-shadow:0 4px 12px rgba(0,0,0,0.15);font-size:15px;position:relative;">
                <div style="font-size:18px;font-weight:bold;margin-bottom:8px;color:#007bff;">${item.kaptName}</div>
                <table style="width:100%;border-collapse:collapse;">
                  <tbody>
                    <tr>
                      <th style="text-align:left;padding:4px 8px 4px 0;color:#007bff;">세대수</th>
                      <td style="padding:4px 0;">${item.kaptdaCnt}</td>
                    </tr>
                    <tr>
                      <th style="text-align:left;padding:4px 8px 4px 0;color:#007bff;">준공일자</th>
                      <td style="padding:4px 0;">${usedateStr || '-'}</td>
                    </tr>
                    <tr>
                      <th style="text-align:left;padding:4px 8px 4px 0;color:#007bff;">건설사</th>
                      <td style="padding:4px 0;">${item.kaptAcompany || '-'}</td>
                    </tr>
                    <tr>
                      <th style="text-align:left;padding:4px 8px 4px 0;color:#007bff;">주소</th>
                      <td style="padding:4px 0; word-break:break-all; max-width:220px;">${displayAddr}</td>
                    </tr>
                    <tr>
                      <td colspan="2" align="center">
                      <a href="https://new.land.naver.com/complexes?ms=${apart.lat},${apart.lng}" target="_blank">NAVER부동산</a>
                      <a href="https://kbland.kr/cl/51022321130?xy=${apart.lat},${apart.lng}" target="_blank">KB부동산</a>
                      </td>
                    </tr>
                    37.51772445,126.932736,17
                  </tbody>
                </table>
                <button onclick="window.closeAptInfoOverlay()" style="position:absolute;top:8px;right:8px;background:none;border:none;font-size:18px;cursor:pointer;color:#007bff;">×</button>
              </div>
            `;
            const overlay = new window.kakao.maps.CustomOverlay({
              position,
              content: infoContent,
              yAnchor: -0.2, // 마커 아래로 충분히 내림
              zIndex: 20,
            });
            overlay.setMap(mapInstance.current);
            setInfoOverlay(overlay);
            infoOverlayRef.current = overlay;
          } catch (e) {
            // 에러시 기존 오버레이 제거
            if (infoOverlayRef.current) infoOverlayRef.current.setMap(null);
            setInfoOverlay(null);
            infoOverlayRef.current = null;
            alert('정보를 불러올 수 없습니다.');
          }
        };

        // 2. content에 onClick 등록
        const overlayContent = `<div class="apartment-overlay" style="background:rgba(255,255,255,0.9);border:1px solid #888;border-radius:4px;padding:2px 6px;font-size:13px;color:#222;white-space:nowrap;margin-top:3px;box-shadow:0 1px 4px rgba(0,0,0,0.08);cursor:pointer;" onclick="window.showAptInfo_${apart.aptcd}()"><span style="font-weight:bold">${apart.name}</span></div>`;

        const overlay = new window.kakao.maps.CustomOverlay({
          position,
          content: overlayContent,
          yAnchor: 0,
        });
        overlay.setMap(mapInstance.current);
        apartmentOverlays.current.push(overlay);
      });
    }

    // 기존 검색 마커 제거
    searchMarkers.forEach(marker => marker.setMap(null));
    setSearchMarkers([]);

    // 검색어가 있으면 검색 마커 추가
    if (address && address.trim() !== '') {
      const places = new window.kakao.maps.services.Places();
      places.keywordSearch(address, (result, status) => {
        if (status === window.kakao.maps.services.Status.OK) {
          setResults(result);
          const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);

          const newMarker = new window.kakao.maps.Marker({
            map: mapInstance.current,
            position: coords,
          });
          setSearchMarkers([newMarker]);
          mapInstance.current.setCenter(coords);
          setShowLayer(false);
        } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
          setLayerMessage(`검색 결과가 없습니다: "${address}"`);
          setShowLayer(true);
        } else {
          setLayerMessage('키워드 검색 중 오류가 발생했습니다.');
          setShowLayer(true);
        }
      });
    }
  }, [address, searchMarkers]);

  useEffect(() => {
    console.log('카카오맵 useEffect 실행');
    const loadKakaoMap = () => {
      if (window.kakao?.maps) {
        window.kakao.maps.load(() => {
          initMap();
        });
      } else if (!document.querySelector('script[src*="dapi.kakao.com"]')) {
        const script = document.createElement('script');
        script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.REACT_APP_KAKAO_MAP_API_KEY}&libraries=services&autoload=false`;
        script.onload = () => {
          window.kakao.maps.load(() => {
            initMap();
          });
        };
        script.onerror = () => {
          setLayerMessage('카카오맵 스크립트를 로드할 수 없습니다.');
          setShowLayer(true);
        };
        document.head.appendChild(script);
      }
    };

    loadKakaoMap();
  }, []);

  const handleResultClick = (item, index) => {
    const coords = new window.kakao.maps.LatLng(item.y, item.x);

    const newMarker = new window.kakao.maps.Marker({
      map: mapInstance.current,
      position: coords,
    });
    setSearchMarkers(prevMarkers => [...prevMarkers, newMarker]);

    mapInstance.current.setCenter(coords);
    setSelectedIndex(index);
  };

  const closeLayer = () => {
    setShowLayer(false);
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Enter' && showLayer) {
        closeLayer();
      }
    };

    if (showLayer) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      if (showLayer) {
        window.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [showLayer]);

  return (
    <>
      {showLayer && (
        <Layer>
          <LayerContent>
            <p dangerouslySetInnerHTML={{ __html: layerMessage }} />
            <button onClick={closeLayer}>닫기</button>
          </LayerContent>
        </Layer>
      )}
      <Layout>
        <LeftPanel>
          <SearchRow>
            <SearchInput
              type="text"
              placeholder="주소 또는 아파트명 검색"
              value={address}
              onChange={e => setAddress(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') initMap();
              }}
            />
            <SearchButton onClick={initMap}>검색</SearchButton>
          </SearchRow>
          {/* 검색결과 리스트 추가 */}
          <ResultList>
            {results.map((item, index) => (
              <ResultItem
                key={item.id || index}
                onClick={() => handleResultClick(item, index)}
                style={{
                  background: selectedIndex === index ? '#e6f0ff' : '#fff',
                  fontWeight: selectedIndex === index ? 'bold' : 'normal',
                }}
              >
                {item.place_name} <br />
                <span style={{ fontSize: '13px', color: '#888' }}>{item.address_name}</span>
              </ResultItem>
            ))}
          </ResultList>
        </LeftPanel>
        <MapContainer ref={mapRef} />
      </Layout>
    </>
  );
};

export default KakaoMap;

