import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../styles/main/main.module.css';

function SearchBar() {
  const navigate = useNavigate(); 
  
  return (
    <div className={styles['search-bar-container']}>
      <div className={styles['search-input']}>
        경주 방폐물처리장을 감싸는 가볼만한 장소 추천
      </div>
      <button className={styles['search-button']} onClick={() => navigate('/tourism')}>
        바로가기
      </button>
    </div>
  );
}

export default SearchBar;
