import React, { useState } from 'react';
import styled from 'styled-components';
import { TextField, Button, Container, Grid } from '@mui/material';
import KakaoMap from './KakaoMap'; // KakaoMap 컴포넌트 import

const SearchContainer = styled.div`
  padding: 2rem;
  text-align: center;
  background-color: #f5f5f5;
  margin: 2rem 0;
`;

const Home = () => {
  const [searchQuery, setSearchQuery] = useState(''); // 검색어 상태 관리
  const [address, setAddress] = useState(''); // 지도에 표시할 주소 상태 관리

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      alert('검색어를 입력하세요.');
      return;
    }
    console.log('검색어:', searchQuery);
    setAddress(searchQuery); // 검색어를 지도에 표시할 주소로 설정
  };

  return (
    <Container>
      <SearchContainer>
        <h1> </h1>
        <form onSubmit={handleSearch}>
          <TextField
            fullWidth
            placeholder="아파트명 또는 지역명을 입력하세요"
            variant="outlined"
            value={searchQuery} // TextField의 값 설정
            onChange={(e) => setSearchQuery(e.target.value)} // 입력 값 업데이트
            sx={{ mb: 2 }}
          />
          <Button variant="contained" color="primary" type="submit">
            검 색
          </Button>
        </form>
      </SearchContainer>

      {/* KakaoMap 컴포넌트 추가 */}
      <KakaoMap address={address} />

      <Grid container spacing={3}>
        <Grid>
          <h2></h2>
          {/* 인기 매물 리스트 컴포넌트 추가 예정 */}
        </Grid>
      </Grid>
    </Container>
  );
};

export default Home;