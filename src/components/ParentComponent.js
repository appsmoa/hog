import React, { useState } from 'react'; // 이미 상단에서 import됨
import KakaoMap from './KakaoMap';

const ParentComponent = () => {
  const [address, setAddress] = useState('서울특별시 강남구');

  return (
    <div>
      <h1>지도 표시</h1>
      <KakaoMap address={address} />
    </div>
  );
};

export default ParentComponent;