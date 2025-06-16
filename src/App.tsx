import React from 'react';
import { Outlet } from 'react-router-dom';
import './App.css';

export default function App() {
  return (
    <div className="container">
     
      
      <main>
        <Outlet />
      </main>
      
      
    </div>
  );
}