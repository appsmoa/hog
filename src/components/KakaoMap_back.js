import React, { useEffect, useRef, useState, useCallback } from 'react';
import styled from 'styled-components';

const MapContainer = styled.div`
  width: 100%;
  height: 400px;
  border-radius: 8px;
  overflow: hidden;
  background-color: hsl(99, 100.00%, 97.30%);
`;

const ErrorMessage = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: red;
  font-size: 16px;
  background: rgba(255, 255, 255, 0.8);
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

const KakaoMap = ({ address }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);

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

      if (!address) {
        setError(null); // 에러 메시지 초기화
        return; // 주소가 없으면 기본 위치만 표시
      }

      const geocoder = new window.kakao.maps.services.Geocoder();
      const fullAddress = `대한민국 ${address}`;
      console.log('검색어:', fullAddress);

      geocoder.addressSearch(fullAddress, (result, status) => {
        if (status === window.kakao.maps.services.Status.OK) {
          setResults(result);
          const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);
          new window.kakao.maps.Marker({
            map: mapInstance.current,
            position: coords,
          });
          mapInstance.current.setCenter(coords);
        } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
          console.error(`검색 결과가 없습니다: ${address}`);
          setError(`검색 결과가 없습니다: ${address}`);
        } else {
          console.error('주소 검색 중 오류 발생:', status);
          setError('주소 검색 중 오류가 발생했습니다.');
        }
      });
    } catch (err) {
      console.error('지도 초기화 중 오류 발생:', err);
      setError('지도 초기화 중 오류가 발생했습니다.');
    }
  }, [address]);

  useEffect(() => {
    const loadKakaoMap = () => {
      if (window.kakao?.maps) {
        // 카카오맵이 이미 로드된 경우
        window.kakao.maps.load(() => {
          initMap();
        });
      } else if (!document.querySelector('script[src*="dapi.kakao.com"]')) {
        // 스크립트가 로드되지 않은 경우
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
          setError('카카오맵 스크립트를 로드할 수 없습니다.');
        };
        document.head.appendChild(script);
      }
    };

    loadKakaoMap();
  }, [initMap]);

  return (
    <>
      <MapContainer ref={mapRef} />
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <ResultList>
        {results.map((item, index) => (
          <ResultItem key={index}>{item.address_name}</ResultItem>
        ))}
      </ResultList>
    </>
  );
};

export default KakaoMap;

