import React from 'react';
import { useParams } from 'react-router-dom';
import { Container, Grid, Paper, Typography } from '@mui/material';
import styled from 'styled-components';
import NearbyInfo from './NearbyInfo';

const InfoSection = styled(Paper)`
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

const ApartmentDetail = () => {
  const { id } = useParams();

  return (
    <Container>
      <Grid container spacing={3}>
        <Grid size={12}>
          <InfoSection>
            <Typography variant="h4">아파트명</Typography>
            <Typography variant="subtitle1">주소</Typography>
          </InfoSection>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <InfoSection>
            <Typography variant="h6">기본 정보</Typography>
            <Grid container spacing={2}>
              <Grid size={6}>
                <Typography>세대수: </Typography>
              </Grid>
              <Grid size={6}>
                <Typography>준공년월: </Typography>
              </Grid>
              <Grid size={6}>
                <Typography>건폐율: </Typography>
              </Grid>
              <Grid size={6}>
                <Typography>용적률: </Typography>
              </Grid>
            </Grid>
          </InfoSection>

          <InfoSection>
            <Typography variant="h6">실거래가 정보</Typography>
            {/* 실거래가 차트 추가 예정 */}
          </InfoSection>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <InfoSection>
            <Typography variant="h6">시세 정보</Typography>
            {/* 시세 정보 추가 예정 */}
          </InfoSection>

          <InfoSection>
            <NearbyInfo address="서울 강남구 테헤란로 152" />
          </InfoSection>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ApartmentDetail;