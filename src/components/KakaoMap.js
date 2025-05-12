import React, { useEffect, useRef, useState, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom'; // React Router의 useNavigate 훅 가져오기

const MapContainer = styled.div`
  width: 100%;
  height: 400px;
  border-radius: 8px;
  overflow: hidden;
  background-color: hsl(99, 100.00%, 97.30%);
`;

const ResultList = styled.ul`
  margin-top: 20px;
  padding: 0;
  list-style: none;
`;

const ResultItem = styled.li`
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  margin-bottom: 10px;
  background-color: #f9f9f9;
  cursor: pointer;

  &:hover {
    background-color: #f1f1f1;
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

const KakaoMap = ({ address }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [results, setResults] = useState([]);
  const [showLayer, setShowLayer] = useState(false); // 레이어 표시 여부 상태
  const [layerMessage, setLayerMessage] = useState(''); // 레이어 메시지 상태
  const navigate = useNavigate(); // useNavigate 훅 초기화

  const initMap = useCallback(() => {
    try {
      if (!mapRef.current || !window.kakao?.maps) {
        throw new Error('카카오맵을 로드할 수 없습니다.');
      }

      if (!mapInstance.current) {
        const options = {
          center: new window.kakao.maps.LatLng(37.566826, 126.9786567), // 서울 기본 위치
          level: 3,
        };
        mapInstance.current = new window.kakao.maps.Map(mapRef.current, options);
      }

      if (!address || address.trim() === '') {
        setLayerMessage('검색어를 입력해주세요.'); // 레이어 메시지 설정
        setShowLayer(true); // 레이어 표시
        return; // 검색어가 없으면 초기화 중단
      }

      const places = new window.kakao.maps.services.Places();
      console.log('검색어:', address);

      places.keywordSearch(address, (result, status) => {
        if (status === window.kakao.maps.services.Status.OK) {
          setResults(result);
          const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);
          new window.kakao.maps.Marker({
            map: mapInstance.current,
            position: coords,
          });
          mapInstance.current.setCenter(coords);
          setShowLayer(false); // 검색 성공 시 레이어 숨기기
        } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
          console.error(`검색 결과가 없습니다: ${address}`);
          setLayerMessage(`검색 결과가 없습니다: "${address}"`);
          setShowLayer(true); // 레이어 표시
        } else {
          console.error('키워드 검색 중 오류 발생:', status);
          setLayerMessage('키워드 검색 중 오류가 발생했습니다.');
          setShowLayer(true); // 레이어 표시
        }
      });
    } catch (err) {
      console.error('지도 초기화 중 오류 발생:', err);
      setLayerMessage('지도 초기화 중 오류가 발생했습니다.');
      setShowLayer(true); // 레이어 표시
    }
  }, [address]);

  useEffect(() => {
    const loadKakaoMap = () => {
      if (window.kakao?.maps) {
        window.kakao.maps.load(() => {
          initMap();
        });
      } else if (!document.querySelector('script[src*="dapi.kakao.com"]')) {
        const script = document.createElement('script');
        script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.REACT_APP_KAKAO_MAP_API_KEY}&libraries=services&autoload=false`;
        script.onload = () => {
          console.log('카카오맵 스크립트 로드 완료');
          window.kakao.maps.load(() => {
            initMap();
          });
        };
        script.onerror = () => {
          console.error('카카오맵 스크립트 로드 실패');
          setLayerMessage('카카오맵 스크립트를 로드할 수 없습니다.');
          setShowLayer(true); // 레이어 표시
        };
        document.head.appendChild(script);
      }
    };

    loadKakaoMap();
  }, [initMap]);

  const handleResultClick = (item) => {
    const coords = new window.kakao.maps.LatLng(item.y, item.x);
    mapInstance.current.setCenter(coords);
    new window.kakao.maps.Marker({
      map: mapInstance.current,
      position: coords,
    });
  };

  const closeLayer = () => {
    setShowLayer(false); // 레이어 닫기
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Enter' && showLayer) {
        closeLayer(); // 엔터 키를 누르면 레이어 닫기
      }
    };

    if (showLayer) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      if (showLayer) {
        window.removeEventListener('keydown', handleKeyDown); // 이벤트 리스너 정리
      }
    };
  }, [showLayer]);

  return (
    <>
      <MapContainer ref={mapRef} />
      {showLayer && (
        <Layer>
          <LayerContent>
            <p>{layerMessage}</p>
            <button onClick={closeLayer}>닫기</button>
          </LayerContent>
        </Layer>
      )}
      {results.length > 0 && (
        <h3>검색 결과 총 {results.length} 건</h3>
      )}
      <ResultList>
        {results.map((item, index) => (
   
          <ResultItem key={index} onClick={() => handleResultClick(item)}>
            {item.place_name} ({item.address_name})
          </ResultItem>
        ))}
      </ResultList>
    </>
  );
};

export default KakaoMap;

