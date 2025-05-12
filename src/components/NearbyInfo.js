import React from 'react';
import styled from 'styled-components';
import { Typography, Grid, Paper } from '@mui/material';
import KakaoMap from './KakaoMap';

const InfoCard = styled(Paper)`
  padding: 1rem;
  margin-bottom: 1rem;
`;

const NearbyInfo = ({ address }) => {
  return (
    <div>
      <Typography variant="h6" gutterBottom>
        주변 정보
      </Typography>
      
      <InfoCard>
        <KakaoMap address={address} />
      </InfoCard>

      <Grid container spacing={2}>
        {/* 교통 정보 */}
        <Grid size={12}>
          <InfoCard>
            <Typography variant="subtitle1" gutterBottom>
              교통
            </Typography>
            <Typography variant="body2">
              • 지하철: 2호선 강남역 도보 5분
              • 버스: 146번, 360번, 740번
            </Typography>
          </InfoCard>
        </Grid>

        {/* 교육 시설 */}
        <Grid size={12}>
          <InfoCard>
            <Typography variant="subtitle1" gutterBottom>
              교육시설
            </Typography>
            <Typography variant="body2">
              • 초등학교: OO초등학교 (도보 10분)
              • 중학교: OO중학교 (도보 15분)
              • 고등학교: OO고등학교 (도보 20분)
            </Typography>
          </InfoCard>
        </Grid>

        {/* 편의시설 */}
        <Grid size={12}>
          <InfoCard>
            <Typography variant="subtitle1" gutterBottom>
              편의시설
            </Typography>
            <Typography variant="body2">
              • 마트: OO마트 (도보 5분)
              • 병원: OO병원 (도보 10분)
              • 공원: OO공원 (도보 7분)
            </Typography>
          </InfoCard>
        </Grid>
      </Grid>
    </div>
  );
};

export default NearbyInfo;