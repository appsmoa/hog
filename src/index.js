import React from 'react';
import ReactDOM from 'react-dom/client'; // React 18 이상에서는 react-dom/client를 사용
import { BrowserRouter } from 'react-router-dom';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root')); // createRoot 사용
root.render(
  <BrowserRouter basename="/hog">
    <App />
  </BrowserRouter>
);