import React, {useState, useEffect} from 'react';

import './App.css';
import Mapper from './components/Map';
import Sidebar from './components/Sidebar'

function App() {

  useEffect(()=>{
    fetch('https://nominatim.openstreetmap.org/search?format=json&q=Bauer Landstraße 17, Flensburg')
      .then(res => res.json())
      .then(res => console.log(res))

  }, []);


  return (
    <>
      <Sidebar className='sidebar' />
      <Mapper id='map' />
    </>)
}

export default App;
