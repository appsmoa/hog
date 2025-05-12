import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './components/Home';
import ApartmentDetail from './components/ApartmentDetail';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route exact path="/" element={<Home />} />
          <Route path="/apt/:id" element={<ApartmentDetail />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;