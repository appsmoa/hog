import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apartments } from '../data/apartments';
import myLocationIcon from '../assets/my-location.png'; // 아이콘 파일을 public 또는 src/assets에 두세요.

const RECENT_KEY = 'recent_addresses';

const KakaoMap = () => {
  const [address, setAddress] = useState('');
  const [recentAddresses, setRecentAddresses] = useState([]);
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
  const myLocationMarkerRef = useRef(null);

  // 최근 검색어 로드
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_KEY);
    if (stored) {
      setRecentAddresses(JSON.parse(stored));
    }
  }, []);

  // 검색어 저장 함수
  const saveRecentAddress = useCallback((keyword) => {
    if (!keyword || !keyword.trim()) return;
    setRecentAddresses(prev => {
      const arr = [keyword, ...prev.filter(v => v !== keyword)];
      const limited = arr.slice(0, 10); // 최대 10개
      localStorage.setItem(RECENT_KEY, JSON.stringify(limited));
      return limited;
    });
  }, []);

  const initMap = useCallback((searchWord) => {
    const keyword = typeof searchWord === 'string' ? searchWord : address;
    if (!mapRef.current || !window.kakao?.maps) return;

    if (!mapInstance.current) {
      const options = {
        center: new window.kakao.maps.LatLng(37.5988459,127.0136836),
        level: 3,
      };
      mapInstance.current = new window.kakao.maps.Map(mapRef.current, options);

      // 지도 타입 변경 컨트롤을 생성한다
		  var mapTypeControl = new window.kakao.maps.MapTypeControl();

		  // 지도의 상단 우측에 지도 타입 변경 컨트롤을 추가한다
      mapInstance.current.addControl(mapTypeControl, window.kakao.maps.ControlPosition.TOPRIGHT);	

   		// 지도에 확대 축소 컨트롤을 생성한다
      var zoomControl = new kakao.maps.ZoomControl();

      // 지도의 우측에 확대 축소 컨트롤을 추가한다
      mapInstance.current.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);
      
      apartments.forEach(apart => {
        const position = new window.kakao.maps.LatLng(apart.lat, apart.lng);

        let tooltipOverlay = null;

        window[`showAptInfo_${apart.aptcd}`] = async (customYear) => {
		  try {
			// 기본 아파트 정보 가져오기
			const res = await fetch(`https://apis.data.go.kr/1613000/AptBasisInfoServiceV3/getAphusBassInfoV3?serviceKey=afU4m%2B7JcibSN7X1GwOWD0ngqwoVtvLMDdTHOwvlUqU6xGT%2BW%2BaGSWk008eVs0xRCLCJp7ksdbvk4qzOEwfMPQ%3D%3D&kaptCode=${apart.aptcd}`);
			if (!res.ok) throw new Error('정보를 불러올 수 없습니다.');
			const data = await res.json();
			const item = data.response?.body?.item;
			if (!item) throw new Error('정보 없음');

			// 기본 정보 처리
			let usedate = item.kaptUsedate;
			let usedateStr = '';
			if (usedate && usedate.length === 8) {
			  usedateStr = `${usedate.slice(0,4)}.${usedate.slice(4,6)}.${usedate.slice(6,8)}`;
			}

			let displayAddr = item.kaptAddr;
			if (item.kaptAddr && item.kaptName && item.kaptAddr.includes(item.kaptName)) {
			  displayAddr = item.kaptAddr.replace(item.kaptName, '').replace(/\s+/g, ' ').trim();
			}

			// 기존 오버레이 제거
			if (infoOverlayRef.current) infoOverlayRef.current.setMap(null);

			// '구' 코드 가져오기
			let gu = '';
			const guMatch = displayAddr.match(/([가-힣]+구)/);
			if (guMatch) {
			  gu = guMatch[1];
			}

			let guCode = '';
			try {
			  const guData = await import('../data/gu.json');
			  if (gu && guData && Array.isArray(guData.default)) {
				const found = guData.default.find(g => g.name === gu);
				if (found) guCode = found.code;
			  }
			} catch (e) {
			  guCode = '';
			}
			if (!guCode) guCode = '11000';

			// 연도 설정 (customYear가 없으면 현재 연도 사용)
			const currentDate = new Date();
			const year = customYear ? parseInt(customYear.slice(0, 4)) : currentDate.getFullYear();
			const allItems = [];
			let dealYmd = `${year}${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

			// 로딩 상태 표시
			const loadingHtml = '<div style="color:#888;font-size:14px;text-align:center;padding:20px;">1년치 데이터 로드 중...</div>';
			
			// 오버레이 생성 및 표시 (로딩 상태)
			const initialContent = `
			  <div class="apt-info-overlay" style="background:#fff;border:1px solid #3490dc;border-radius:12px;padding:24px;min-width:240px;box-shadow:0 2px 12px rgba(52,144,220,0.08);font-size:16px;position:relative;" onwheel="event.stopPropagation();">
			    <div style="font-size:20px;font-weight:bold;margin-bottom:12px;color:#3490dc;">🏦 ${item.kaptName}</div>
			    <table style="width:100%;border-collapse:collapse;">
			      <tbody>
			        <tr>
			          <th style="text-align:left;padding:4px 8px;color:#3490dc;">준공일자</th>
			          <td style="padding:4px 0;">${usedateStr || '-'} (${item.kaptdaCnt} 세대)</td>
			        </tr>
			        <tr>
			          <th style="text-align:left;padding:4px 8px;color:#3490dc;">건설사</th>
			          <td style="padding:4px 0;">${item.kaptAcompany || '-'}</td>
			        </tr>
			        <tr>
			          <th style="text-align:left;padding:4px 8px;color:#3490dc;">주소</th>
			          <td style="padding:4px 0;word-break:break-all;max-width:220px;">${displayAddr}</td>
			        </tr>
			        <tr>
			          <td colspan="2" align="center" style="padding-top:8px;">
			            <a href="https://new.land.naver.com/complexes?ms=${apart.lat},${apart.lng}" 
			              target="_blank" 
			              style="display:inline-block;padding:4px 16px;margin-right:12px;border-radius:6px;border:2px solid #38a169;background:#fff;font-weight:bold;color:#38a169;text-decoration:none;">
			              NAVER부동산
			            </a>
			            <a href="https://kbland.kr/cl/51022321130?xy=${apart.lat},${apart.lng}" 
			              target="_blank" 
			              style="display:inline-block;padding:4px 16px;border-radius:6px;border:2px solid #ecc94b;background:#fff;font-weight:bold;color:#ecc94b;text-decoration:none;">
			              KB부동산
			            </a>
			          </td>
			        </tr>
			      </tbody>
			    </table>
			    <div style="margin-top:16px;">
			      <div style="font-weight:bold;color:#3490dc;margin-bottom:4px;display:flex;align-items:center;justify-content:center;gap:8px;">
			        <button onclick="event.preventDefault(); window.changeAptDealYear('${apart.aptcd}','${guCode}','${year}',-1)" style="background:none;border:none;font-size:18px;cursor:pointer;color:#3490dc;padding:0 6px;">&#8592;</button>
			        <span>${year}년 실거래가</span>
			        <button onclick="event.preventDefault(); window.changeAptDealYear('${apart.aptcd}','${guCode}','${year}',1)" style="background:none;border:none;font-size:18px;cursor:pointer;color:#3490dc;padding:0 6px;">&#8594;</button>
			      </div>
			      ${loadingHtml}
			    </div>
			    <button onclick="window.closeAptInfoOverlay()" style="position:absolute;top:8px;right:8px;background:none;border:none;font-size:20px;cursor:pointer;color:#3490dc;">×</button>
			  `;

			// 카카오맵 CustomOverlay로 생성
			const position = new window.kakao.maps.LatLng(apart.lat, apart.lng);
			const overlay = new window.kakao.maps.CustomOverlay({
			  position,
			  content: initialContent,
			  yAnchor: 0.3,
			  zIndex: 20,
			});
			overlay.setMap(mapInstance.current);
			infoOverlayRef.current = overlay;
			setInfoOverlay(overlay);

			// 1월~12월 반복 요청
			for (let m = 1; m <= 12; m++) {
			  const monthYmd = `${year}${String(m).padStart(2, '0')}`;
			  try {
				const tradeRes = await fetch(
				  `https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev?serviceKey=afU4m%2B7JcibSN7X1GwOWD0ngqwoVtvLMDdTHOwvlUqU6xGT%2BW%2BaGSWk008eVs0xRCLCJp7ksdbvk4qzOEwfMPQ%3D%3D&LAWD_CD=${guCode}&DEAL_YMD=${monthYmd}&pageNo=1&numOfRows=1000`
				);
				if (tradeRes.ok) {
				  const tradeXml = await tradeRes.text();
				  const parser = new window.DOMParser();
				  const xmlDoc = parser.parseFromString(tradeXml, "text/xml");
				  const items = Array.from(xmlDoc.getElementsByTagName("item"));
				  allItems.push(...items);
				}
			  } catch (e) {
				console.error(`${m}월 데이터 로드 실패:`, e);
			  }
			}

			// 아파트명으로 필터링
			const filtered = allItems.filter(item => {
			  const name = item.getElementsByTagName("aptNm")[0]?.textContent?.trim();
			  const roadNm = item.getElementsByTagName("roadNm")[0]?.textContent?.trim();
			  const roadNmBonbun = item.getElementsByTagName("roadNmBonbun")[0]?.textContent?.trim();
			  const roadStr = roadNm + (roadNmBonbun ? ` ${roadNmBonbun.replace(/^0+/, "")}` : '');
			  
			  return (name === apart.name.replace("아파트","") || apart.address.includes(roadStr));
			});

			// 거래일 기준 내림차순 정렬
			const sorted = filtered.sort((a, b) => {
			  const ay = a.getElementsByTagName("dealYear")[0]?.textContent?.trim() || '';
			  const am = a.getElementsByTagName("dealMonth")[0]?.textContent?.trim().padStart(2, '0') || '';
			  const ad = a.getElementsByTagName("dealDay")[0]?.textContent?.trim().padStart(2, '0') || '';
			  const by = b.getElementsByTagName("dealYear")[0]?.textContent?.trim() || '';
			  const bm = b.getElementsByTagName("dealMonth")[0]?.textContent?.trim().padStart(2, '0') || '';
			  const bd = b.getElementsByTagName("dealDay")[0]?.textContent?.trim().padStart(2, '0') || '';
			  const adate = ay + am + ad;
			  const bdate = by + bm + bd;
			  return bdate.localeCompare(adate);
			});

			// 테이블 생성
			let tradeInfoHtml = '<div style="color:#888;font-size:14px;text-align:center;padding:5px 5px">거래 정보 없음</div>';
			if (sorted.length > 0) {
			  tradeInfoHtml = `
				<div style="max-height:300px; overflow-y:auto; border-top:1px solid #e2e8f0;" class="trade-info-scroll" onwheel="event.stopPropagation();">
				  <table style="width:100%;margin-top:10px;font-size:14px;" >
				    <thead style="position:sticky; top:0; background-color:white; z-index:1;">
				      <tr>
				        <th style="color:#3490dc;">거래일</th>
				        <th style="color:#3490dc;">전용면적</th>
				        <th style="color:#3490dc;">층</th>
				        <th style="color:#3490dc;">거래가(만원)</th>
				      </tr>
				    </thead>
				    <tbody>
				      ${sorted.slice(0,100).map(item => {
				        const y = item.getElementsByTagName("dealYear")[0]?.textContent?.trim() || '-';
				        const m = item.getElementsByTagName("dealMonth")[0]?.textContent?.trim() || '-';
				        const d = item.getElementsByTagName("dealDay")[0]?.textContent?.trim() || '-';
				        const area = item.getElementsByTagName("excluUseAr")[0]?.textContent?.trim() || '-';
				        const floor = item.getElementsByTagName("floor")[0]?.textContent?.trim() || '-';
				        const price = item.getElementsByTagName("dealAmount")[0]?.textContent?.replace(/,/g, '').trim() || '-';
				        const ymd = (y !== '-' && m !== '-' && d !== '-') ? `${y}.${m.padStart(2,'0')}.${d.padStart(2,'0')}` : '-';
				        return `<tr>
				          <td align="center">${ymd}</td>
				          <td align="center">${area !== '-' ? parseFloat(area).toFixed(1) : '-'}㎡ / ${(parseFloat(area)*0.3025*1.3).toFixed(1)}평</td>
				          <td align="center">${floor}</td>
				          <td align="center" style="font-weight:bold;color:#e53e3e;">${price !== '-' ? formatKoreanPrice(price) : '-'}</td>
				        </tr>`;
				      }).join('')}
				    </tbody>
				  </table>
				</div>
			  `;
			}

			// 최종 오버레이 내용 업데이트
			const finalContent = `
			  <div class="apt-info-overlay" style="background:#fff;border:1px solid #3490dc;border-radius:12px;padding:24px;min-width:240px;box-shadow:0 2px 12px rgba(52,144,220,0.08);font-size:16px;position:relative;" onwheel="event.stopPropagation();">
			    <div style="font-size:20px;font-weight:bold;margin-bottom:12px;color:#3490dc;">🏦 ${item.kaptName}</div>
			    <table style="width:100%;border-collapse:collapse;">
			      <tbody>
			        <tr>
			          <th style="text-align:left;padding:4px 8px;color:#3490dc;">준공일자</th>
			          <td style="padding:4px 0;">${usedateStr || '-'} (${item.kaptdaCnt} 세대)</td>
			        </tr>
			        <tr>
			          <th style="text-align:left;padding:4px 8px;color:#3490dc;">건설사</th>
			          <td style="padding:4px 0;">${item.kaptAcompany || '-'}</td>
			        </tr>
			        <tr>
			          <th style="text-align:left;padding:4px 8px;color:#3490dc;">주소</th>
			          <td style="padding:4px 0;word-break:break-all;max-width:220px;">${displayAddr}</td>
			        </tr>
			        <tr>
			          <td colspan="2" align="center" style="padding-top:8px;">
			            <a href="https://new.land.naver.com/complexes?ms=${apart.lat},${apart.lng}" 
			              target="_blank" 
			              style="display:inline-block;padding:4px 16px;margin-right:12px;border-radius:6px;border:2px solid #38a169;background:#fff;font-weight:bold;color:#38a169;text-decoration:none;">
			              NAVER부동산
			            </a>
			            <a href="https://kbland.kr/cl/51022321130?xy=${apart.lat},${apart.lng}" 
			              target="_blank" 
			              style="display:inline-block;padding:4px 16px;border-radius:6px;border:2px solid #ecc94b;background:#fff;font-weight:bold;color:#ecc94b;text-decoration:none;">
			              KB부동산
			            </a>
			          </td>
			        </tr>
			      </tbody>
			    </table>
			    <div style="margin-top:16px;">
			      <div style="font-weight:bold;color:#3490dc;margin-bottom:4px;display:flex;align-items:center;justify-content:center;gap:8px;">
			        <button onclick="event.preventDefault(); window.changeAptDealYear('${apart.aptcd}','${guCode}','${year}',-1)" style="background:none;border:none;font-size:18px;cursor:pointer;color:#3490dc;padding:0 6px;">&#8592;</button>
			        <span>${year}년 실거래가</span>
			        <button onclick="event.preventDefault(); window.changeAptDealYear('${apart.aptcd}','${guCode}','${year}',1)" style="background:none;border:none;font-size:18px;cursor:pointer;color:#3490dc;padding:0 6px;">&#8594;</button>
			      </div>
			      ${tradeInfoHtml}
			    </div>
			    <button onclick="window.closeAptInfoOverlay()" style="position:absolute;top:8px;right:8px;background:none;border:none;font-size:20px;cursor:pointer;color:#3490dc;">×</button>
			  `;

			// 오버레이 내용 업데이트
			if (infoOverlayRef.current) {
			  infoOverlayRef.current.setContent(finalContent);
			}

			// 연도 이동 함수
			window.changeAptDealYear = async (aptcd, guCode, baseYear, diff) => {
			  try {
				const newYear = parseInt(baseYear) + diff;
				await window[`showAptInfo_${aptcd}`](`${newYear}01`);
			  } catch (error) {
				console.error('연도 이동 중 오류 발생:', error);
			  }
			};

			// 오버레이 닫기 함수
			window.closeAptInfoOverlay = () => {
			  if (infoOverlayRef.current) {
				infoOverlayRef.current.setMap(null);
				infoOverlayRef.current = null;
				setInfoOverlay(null);
			  }
			};

		  } catch (e) {
			console.error('데이터 로드 실패:', e);
			alert('정보를 불러올 수 없습니다.');
		  }
		};
		// ... existing code ...

        const overlayContent = document.createElement('div');
        overlayContent.className = 'apartment-overlay';
        overlayContent.style.cssText = 'background:#fff;border:1px solid #ddd;border-radius:6px;padding:2px 8px;font-size:14px;color:#222;white-space:nowrap;margin-top:3px;box-shadow:0 1px 4px rgba(0,0,0,0.08);cursor:pointer;';
        overlayContent.innerHTML = `<span style="font-weight:bold">🏦 ${apart.name}</span>`;

        overlayContent.onmouseover = async (e) => {

          if (tooltipOverlay) tooltipOverlay.setMap(null);
          let address = apart.address;
          let tnohsh = apart.tnohsh;
          if (!address || !tnohsh) {
            try {
              const res = await fetch(`https://apis.data.go.kr/1613000/AptBasisInfoServiceV3/getAphusBassInfoV3?serviceKey=afU4m%2B7JcibSN7X1GwOWD0ngqwoVtvLMDdTHOwvlUqU6xGT%2BW%2BaGSWk008eVs0xRCLCJp7ksdbvk4qzOEwfMPQ%3D%3D&kaptCode=${apart.aptcd}`);
              if (!res.ok) throw new Error();
              const data = await res.json();
              const item = data.response?.body?.item;
              address = item?.kaptAddr || '';
              tnohsh = item?.kaptdaCnt || '';
            } catch {
              address = '(정보 없음)';
              tnohsh = '-';
            }
          }

          const tooltipContent = `
            <div class="tooltipContentCss" style="background:#3490dc;color:#fff;padding:8px 18px;border-radius:8px;font-size:15px;box-shadow:0 2px 8px rgba(52,144,220,0.18);white-space:nowrap;">
              ${address}<br/>
              세대수 : ${tnohsh}
            </div>
          `;
          tooltipOverlay = new window.kakao.maps.CustomOverlay({
            position,
            content: tooltipContent,
            yAnchor: 1.2,
            zIndex: 30,
          });
          tooltipOverlay.setMap(mapInstance.current);
        };

        overlayContent.onmouseout = () => {
          if (tooltipOverlay) {
            tooltipOverlay.setMap(null);
            tooltipOverlay = null;
          }
          
          //모든 tooltipContentCss 요소를 숨기길 원함
          const tooltipContentCss = document.querySelectorAll('.tooltipContentCss');
          tooltipContentCss.forEach((element) => {
            element.style.display = 'none';
          });
        };

        overlayContent.onclick = () => window[`showAptInfo_${apart.aptcd}`]();

        const overlay = new window.kakao.maps.CustomOverlay({
          position,
          content: overlayContent,
          yAnchor: 0,
        });
        overlay.setMap(mapInstance.current);
        apartmentOverlays.current.push(overlay);
      });
    }

    searchMarkers.forEach(marker => marker.setMap(null));
    setSearchMarkers([]);

    if (keyword && keyword.trim() !== '') {
      const places = new window.kakao.maps.services.Places();
      places.keywordSearch(keyword, (result, status) => {
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

          // 검색 성공 시 최근 검색어 저장
          saveRecentAddress(keyword);
        } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
          setLayerMessage(`검색 결과가 없습니다: "${keyword}"`);
          setShowLayer(true);
        } else {
          setLayerMessage('키워드 검색 중 오류가 발생했습니다.');
          setShowLayer(true);
        }
      });
    }
  }, [address, searchMarkers, saveRecentAddress]);

  useEffect(() => {
    const loadKakaoMap = () => {
      const oldScript = document.querySelector('script[src*="dapi.kakao.com"]');
      if (oldScript) {
        oldScript.parentNode.removeChild(oldScript);
        delete window.kakao;
      }

      const script = document.createElement('script');
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.REACT_APP_KAKAO_MAP_API_KEY}&libraries=services,clusterer&autoload=false`;
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

  // 최근 검색어 클릭 시
  const handleRecentClick = (keyword) => {
    setAddress(keyword);
    initMap(keyword);
  };

  const closeLayer = () => {
    setShowLayer(false);
  };

  // 현재 위치로 이동하는 함수
  const moveToMyLocation = () => {
    if (!mapInstance.current || !window.kakao?.maps) return;
    if (!navigator.geolocation) {
      alert('이 브라우저에서는 위치 기능을 지원하지 않습니다.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const loc = new window.kakao.maps.LatLng(lat, lng);

        // 기존 마커 제거
        if (myLocationMarkerRef.current) {
          myLocationMarkerRef.current.setMap(null);
          myLocationMarkerRef.current = null;
        }

        // 마커 생성하지 않고 지도만 이동
        mapInstance.current.setCenter(loc);
        mapInstance.current.setLevel(3);
      },
      err => {
        alert('위치 정보를 가져올 수 없습니다.');
      }
    );
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

  // 동적으로 스타일 태그 추가 (중복 방지)
  useEffect(() => {
    if (!document.getElementById('kakaomap-mobile-style')) {
      const style = document.createElement('style');
      style.id = 'kakaomap-mobile-style';
      style.innerHTML = `
        @media (max-width: 768px) {
          .kakaomap-flex-wrap {
            flex-direction: column !important;
            gap: 0 !important;
            min-height: 0 !important;
            height: 100vh !important;
          }
          .kakaomap-left-panel {
            width: 100% !important;
            min-width: 0 !important;
            height: auto !important;
            max-height: 50vh !important; /* 추가: 모바일에서 최대 높이 제한 */
            border-radius: 0 0 12px 12px !important;
            box-shadow: none !important;
            padding: 16px 8px !important;
            overflow: hidden !important;
          }
          .kakaomap-map-panel {
            width: 100% !important;
            height: 400px !important;
            min-height: 300px !important;
            border-radius: 12px 12px 0 0 !important;
          }
          .kakaomap-result-list {
            max-height: 30vh !important; /* 추가: 검색 결과 리스트 스크롤 */
            overflow-y: auto !important;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <>
      {showLayer && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            padding: '32px',
            borderRadius: '16px',
            textAlign: 'center',
            boxShadow: '0 2px 16px rgba(0,0,0,0.12)'
          }}>
            <p style={{ marginBottom: '20px', fontSize: '16px', color: '#222' }} dangerouslySetInnerHTML={{ __html: layerMessage }} />
            <button
              style={{
                padding: '8px 28px',
                background: '#3490dc',
                color: '#fff',
                borderRadius: '8px',
                fontSize: '16px',
                border: 'none',
                cursor: 'pointer'
              }}
              onClick={closeLayer}
            >
              닫기
            </button>
          </div>
        </div>
      )}
      <div  className="kakaomap-flex-wrap"
      style={{
        display: 'flex',
        width: '100%',
        minHeight: '500px',
        gap: '24px'
      }}>
        <div  className="kakaomap-left-panel"
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 'none',
          width: '320px',
          minWidth: '260px',
          height: '100vh',
          background: '#f9f9f9',
          borderRadius: '12px',
          padding: '24px 16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="주소 ��는 아파트명 검색"
              value={address}
              onChange={e => setAddress(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') initMap();
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #ccc',
                fontSize: '16px',
                minWidth: 0
              }}
            />
            <button
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                background: '#3490dc',
                color: '#fff',
                fontSize: '16px',
                border: 'none',
                cursor: 'pointer'
              }}
              onClick={() => initMap()}
            >
              검색
            </button>
          </div>
          {/* 최근 검색어 리스트 */}
          {recentAddresses.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#3490dc', fontSize: '15px' }}>최근 검색어</div>
              <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: 0, margin: 0, listStyle: 'none' }}>
                {recentAddresses.map((word, idx) => (
                  <li key={word + idx}>
                    <button
                      style={{
                        background: '#e6f0fa',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '4px 12px',
                        fontSize: '14px',
                        color: '#3490dc',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleRecentClick(word)}
                    >
                      {word}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <ul 
          className="kakaomap-result-list"
          style={{
            marginTop: '8px',
            padding: 0,
            listStyle: 'none',
            flex: 1,
            overflowY: 'auto'
          }}>
            {results.map((item, index) => (
              <li
                key={item.id || index}
                onClick={() => handleResultClick(item, index)}
                style={{
                  padding: '12px',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  background: selectedIndex === index ? '#e6f0fa' : '#fff',
                  cursor: 'pointer',
                  fontWeight: selectedIndex === index ? 'bold' : 'normal',
                  fontSize: '16px'
                }}
              >
                {item.place_name} <br />
                <span style={{ fontSize: '13px', color: '#888' }}>{item.address_name}</span>
              </li>
            ))}
          </ul>
        </div>
        <div
          ref={mapRef}
          style={{
            flex: 1,
            height: '100vh',
            borderRadius: '12px',
            overflow: 'hidden',
            background: '#f6fff6',
            position: 'relative'
          }}
        >
          {/* 현재위치 버튼 - 좌측하단으로 이동 */}
          <button
            onClick={moveToMyLocation}
            style={{
              position: 'absolute',
              left: 40,
              bottom: 'calc(100px + env(safe-area-inset-bottom))', // 변경
              zIndex: 10,
              background: '#fff',
              border: '1px solid #3490dc',
              borderRadius: '50%',
              width: 48,
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(52,144,220,0.12)',
              cursor: 'pointer'
            }}
            title="내 위치로 이동"
          >
            <img src={myLocationIcon} alt="내 위치" style={{ width: 28, height: 28 }} />
          </button>
        </div>
      </div>
    </>
  );
};

export default KakaoMap;

// 사용자 정의 함수
function formatKoreanPrice(price) {
  const units = [
    { value: 10000, label: '억' },
    { value: 1000, label: '천' },
    { value: 100, label: '백' },
    { value: 10, label: '십' },
    { value: 1, label: '' }  // 만 단위라 마지막에 "만원" 붙일 것
  ];

  let result = '';
  for (const unit of units) {
    const unitCount = Math.floor(price / unit.value);
    if (unitCount > 0) {
      if (unit.value >= 10) {
        // 1십 대신 십으로 표기하는 처리 (선택 사항)
        result += (unitCount > 1 ? unitCount : '') + unit.label;
      } else {
        result += unitCount + unit.label;
      }
      price %= unit.value;
    }
  }

  return result;
}
