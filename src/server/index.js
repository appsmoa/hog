const express = require('express');
const app = express();

app.use(express.json());

// 아파트 기본 정보 API
app.get('/api/apartments/:id', async (req, res) => {
  // 아파트 정보 조회 로직
});

// 실거래가 정보 API
app.get('/api/apartments/:id/transactions', async (req, res) => {
  // 실거래 정보 조회 로직
});

// 시세 정보 API
app.get('/api/apartments/:id/market-price', async (req, res) => {
  // 시세 정보 조회 로직
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});