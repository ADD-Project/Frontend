import { useState, useEffect } from "react";
import "./Slider.css";

// 하드코딩된 임시 데이터 (이후 API 등에서 받아오는 형태로 변경 가능)
const mockData = [
  {
    year: 2001,
    residents: [
      { id: 4, name: "정지원", image: "/images/profile4.png" },
      { id: 5, name: "최동훈", image: "/images/profile5.png" },
    ],
  },
  {
    year: 2002,
    residents: [
      { id: 1, name: "김철수", image: "/images/profile1.png" },
      { id: 2, name: "이영희", image: "/images/profile2.png" },
      { id: 3, name: "박민수", image: "/images/profile3.png" },
    ],
  },
];

function App() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState(-1);

  useEffect(() => {
    // 5초(5000ms)마다 다음 인덱스로 넘어가도록 타이머 설정
    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        setPrevIndex(prev);
        return (prev + 1) % mockData.length;
      });
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  // 슬라이드가 왼쪽으로 완전히 빠진 후(1초 뒤) prevIndex를 초기화하여 오른쪽 대기 상태로 애니메이션 없이 즉시 이동
  useEffect(() => {
    if (prevIndex !== -1) {
      const timeout = setTimeout(() => {
        setPrevIndex(-1);
      }, 1000); // CSS transition 시간(1초)과 동일하게 설정
      return () => clearTimeout(timeout);
    }
  }, [prevIndex]);

  return (
    <div className="app-container">
      <div className="slider-wrapper">
        {mockData.map((data, index) => {
          // 슬라이드 애니메이션을 위한 클래스 계산
          let positionClass = "next-slide";
          if (index === currentIndex) {
            positionClass = "active-slide";
          } else if (index === prevIndex) {
            positionClass = "prev-slide";
          }

          return (
            <div key={data.year} className={`slide ${positionClass}`}>
              <h1 className="year-title">{data.year}년 입소자</h1>
              <div className="resident-list">
                {data.residents.map((resident) => (
                  <div key={resident.id} className="resident-card">
                    <img
                      src={resident.image}
                      alt={resident.name}
                      onError={(e) => {
                        // 이미지 로드 실패 시 대체 이미지
                        e.target.src = "/images/profile.png";
                      }}
                    />
                    <h2 className="resident-name">{resident.name}</h2>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;
