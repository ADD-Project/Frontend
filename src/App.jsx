import { useState, useEffect } from "react";
import * as Hangul from "hangul-js";
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

// 가상 키보드 레이아웃
const keyboardLayouts = {
  ko: [
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
    ["ㅂ", "ㅈ", "ㄷ", "ㄱ", "ㅅ", "ㅛ", "ㅕ", "ㅑ", "ㅐ", "ㅔ"],
    ["ㅁ", "ㄴ", "ㅇ", "ㄹ", "ㅎ", "ㅗ", "ㅓ", "ㅏ", "ㅣ"],
    ["Shift", "ㅋ", "ㅌ", "ㅊ", "ㅍ", "ㅠ", "ㅜ", "ㅡ", "지우기"],
    ["한/영", "Space", "닫기"],
  ],
  koShift: [
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
    ["ㅃ", "ㅉ", "ㄸ", "ㄲ", "ㅆ", "ㅛ", "ㅕ", "ㅑ", "ㅒ", "ㅖ"],
    ["ㅁ", "ㄴ", "ㅇ", "ㄹ", "ㅎ", "ㅗ", "ㅓ", "ㅏ", "ㅣ"],
    ["Shift", "ㅋ", "ㅌ", "ㅊ", "ㅍ", "ㅠ", "ㅜ", "ㅡ", "지우기"],
    ["한/영", "Space", "닫기"],
  ],
  en: [
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
    ["Shift", "z", "x", "c", "v", "b", "n", "m", "지우기"],
    ["한/영", "Space", "닫기"],
  ],
  enShift: [
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["Shift", "Z", "X", "C", "V", "B", "N", "M", "지우기"],
    ["한/영", "Space", "닫기"],
  ],
};

function App() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState(-1);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState("slider"); // "slider" 또는 "search"
  const [searchValue, setSearchValue] = useState(""); // 검색어 상태
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false); // 키보드 표시 여부
  const [isLangKo, setIsLangKo] = useState(true); // 한/영 상태
  const [isShift, setIsShift] = useState(false); // Shift 상태 추가

  useEffect(() => {
    if (currentView !== "slider") return; // 검색 화면일 때는 슬라이드 타이머 중지

    // 스크롤될 시간을 충분히 주기 위해 5초 -> 15초(15000ms)로 대기 시간 연장
    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        setPrevIndex(prev);
        return (prev + 1) % mockData.length;
      });
    }, 15000);

    return () => clearInterval(timer);
  }, [currentView]);

  // 슬라이드가 왼쪽으로 완전히 빠진 후(1초 뒤) prevIndex를 초기화하여 오른쪽 대기 상태로 애니메이션 없이 즉시 이동
  useEffect(() => {
    if (prevIndex !== -1) {
      const timeout = setTimeout(() => {
        setPrevIndex(-1);
      }, 1000); // CSS transition 시간(1초)과 동일하게 설정
      return () => clearTimeout(timeout);
    }
  }, [prevIndex]);

  // 리스트 자동 스크롤 애니메이션 추가
  useEffect(() => {
    if (currentView !== "slider") return; // 검색 화면일 때는 스크롤 타이머 중지

    let scrollInterval;
    let startTimeout;

    const listElement = document.querySelector(".active-slide .resident-list");

    if (listElement) {
      listElement.scrollTop = 0; // 화면 진입 시 스크롤 맨 위로 초기화

      // 슬라이드가 들어오는 애니메이션(1초)을 기다린 후 스크롤 시작
      startTimeout = setTimeout(() => {
        scrollInterval = setInterval(() => {
          if (
            listElement.scrollTop + listElement.clientHeight <
            listElement.scrollHeight
          ) {
            listElement.scrollTop += 1; // 아래로 1px씩 이동
          }
        }, 20); // 20ms마다 1px 이동 (숫자가 작을수록 스크롤 속도가 빠름)
      }, 1000);
    }

    return () => {
      clearTimeout(startTimeout);
      clearInterval(scrollInterval);
    };
  }, [currentIndex, currentView]);

  // 메뉴 열기/닫기 토글 함수
  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  // 메뉴 선택 시 화면 전환 및 메뉴 닫기
  const handleMenuClick = (view) => {
    setCurrentView(view);
    setIsMenuOpen(false);
    if (view !== "search") {
      setIsKeyboardOpen(false); // 화면 이동 시 키보드 닫기
      setIsShift(false);
    }
  };

  // 가상 키보드 입력 핸들러 (hangul-js 적용)
  const handleKeyPress = (key) => {
    if (key === "지우기") {
      // 1. 현재 검색어를 자음/모음 단위로 분해 (예: "가" -> ['ㄱ', 'ㅏ'])
      const strokes = Hangul.disassemble(searchValue);
      // 2. 맨 마지막 자음/모음 하나 제거
      strokes.pop();
      // 3. 다시 글자로 결합해서 상태 업데이트
      setSearchValue(Hangul.assemble(strokes));
    } else if (key === "Space") {
      setSearchValue((prev) => prev + " ");
    } else if (key === "Shift") {
      setIsShift(!isShift);
    } else if (key === "닫기") {
      setIsKeyboardOpen(false);
      setIsShift(false);
    } else if (key === "한/영") {
      setIsLangKo(!isLangKo);
      setIsShift(false); // 언어 변경 시 Shift 초기화
    } else {
      // 자음/모음 결합 (예: 'ㄱ' 상태에서 'ㅏ' 입력 시 "가"로 자동 결합)
      const strokes = Hangul.disassemble(searchValue);
      strokes.push(key);
      setSearchValue(Hangul.assemble(strokes));

      // 문자 입력 후 Shift 자동 해제 (모바일 키보드 방식)
      if (isShift) setIsShift(false);
    }
  };

  // 현재 상태에 맞는 키보드 레이아웃 선택
  const currentKeyboardLayout = isLangKo
    ? isShift
      ? keyboardLayouts.koShift
      : keyboardLayouts.ko
    : isShift
      ? keyboardLayouts.enShift
      : keyboardLayouts.en;

  return (
    <div className="app-container">
      {currentView === "slider" ? (
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
      ) : currentView === "search" ? (
        <div className="search-wrapper">
          <div className="search-header">
            <input
              type="text"
              className="search-input"
              placeholder="입소자 이름 검색..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onFocus={() => setIsKeyboardOpen(true)}
              onClick={() => setIsKeyboardOpen(true)}
              inputMode="none" /* 모바일/OS 기본 터치 키보드가 올라오는 것을 방지 */
            />
            <button
              className="search-btn"
              onClick={() => setIsKeyboardOpen(false)}
            >
              검색
            </button>
          </div>

          {/* 가상 키보드 영역 */}
          {isKeyboardOpen && (
            <>
              {/* 외부 클릭 시 키보드 닫기를 위한 오버레이 */}
              <div
                className="keyboard-overlay"
                onClick={() => setIsKeyboardOpen(false)}
              ></div>
              <div className="virtual-keyboard">
                {currentKeyboardLayout.map((row, rowIndex) => (
                  <div key={rowIndex} className="keyboard-row">
                    {row.map((key) => (
                      <button
                        key={key}
                        className={`key-btn ${["지우기", "한/영", "닫기", "Shift"].includes(key) ? "action-key" : ""} ${
                          key === "Space" ? "space-key" : ""
                        } ${key === "Shift" && isShift ? "active-shift" : ""}`}
                        onMouseDown={(e) =>
                          e.preventDefault()
                        } /* 버튼 터치 시 검색창 포커스를 잃지 않도록 방지 */
                        onClick={() => handleKeyPress(key)}
                      >
                        {key}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      ) : null}

      {/* 우측 하단 플로팅 메뉴 */}
      <div className="floating-menu-container">
        <div className={`menu-items ${isMenuOpen ? "open" : ""}`}>
          <button
            className="menu-item"
            onClick={() => handleMenuClick("search")}
          >
            검색하기
          </button>
          <button
            className="menu-item"
            onClick={() => handleMenuClick("slider")}
          >
            홈으로 가기
          </button>
          <button className="menu-item">관리자</button>
        </div>
        <button className="menu-toggle-btn" onClick={toggleMenu}>
          {isMenuOpen ? "✕" : "☰"}
        </button>
      </div>
    </div>
  );
}

export default App;
