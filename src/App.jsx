import { useState, useEffect } from "react";
import * as Hangul from "hangul-js";
import "./Slider.css";

// 조회할 연도 리스트 생성 (1978년 ~ 현재 연도)
const START_YEAR = 1978;
const CURRENT_YEAR = new Date().getFullYear();
const yearsList = Array.from(
  { length: CURRENT_YEAR - START_YEAR + 1 },
  (_, i) => START_YEAR + i,
);

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
  const [currentView, setCurrentView] = useState("slider"); // "slider", "search" 또는 "detail"
  const [searchValue, setSearchValue] = useState(""); // 검색어 상태
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false); // 키보드 표시 여부
  const [isLangKo, setIsLangKo] = useState(true); // 한/영 상태
  const [isShift, setIsShift] = useState(false); // Shift 상태 추가
  const [selectedResident, setSelectedResident] = useState(null); // 클릭한 회원 객체
  const [showPinModal, setShowPinModal] = useState(false); // 고유번호 팝업창 표시 여부
  const [pinInput, setPinInput] = useState(""); // 입력된 고유번호
  const [showAdminModal, setShowAdminModal] = useState(false); // 관리자 로그인 팝업창
  const [adminPinInput, setAdminPinInput] = useState(""); // 입력된 관리자 비밀번호
  const [adminSearchValue, setAdminSearchValue] = useState(""); // 관리자 회원 조회 검색어
  const [adminCurrentPage, setAdminCurrentPage] = useState(1); // 관리자 페이지네이션
  const [adminSelectedResident, setAdminSelectedResident] = useState(null); // 관리자 화면 회원 수정 팝업용
  const [adminSelectedForDelete, setAdminSelectedForDelete] = useState([]); // 삭제하기 위해 체크된 회원 ID 배열
  const [residentsByYear, setResidentsByYear] = useState({}); // 연도별 입소자 데이터 상태

  // 컴포넌트 마운트 시 전체 연도의 데이터를 비동기로 미리 호출하여 캐싱 (검색 및 슬라이더용)
  useEffect(() => {
    yearsList.forEach((year) => {
      fetch(`/api/members/admission-years/${year}`, {
        method: "GET",
      })
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data) {
            // API 응답 데이터를 기존 UI 구조에 맞게 매핑
            const mappedData = json.data.map((r) => ({
              year: year,
              id: r.memberId,
              name: r.name,
              image: r.profileImagePath || "/images/profile.png", // 이미지가 없을 때 기본 이미지로 대체
              pin: "1234", // API에 없으면 기본값 세팅 (테스트용)
              date: `${year}-01-01`, // API에 없으면 임시 설정
              department: "미배정", // API에 없으면 임시 설정
              deptHistory: [],
              coworkers: [],
            }));
            setResidentsByYear((prev) => ({ ...prev, [year]: mappedData }));
          } else {
            setResidentsByYear((prev) => ({ ...prev, [year]: [] }));
          }
        })
        .catch((err) => {
          console.error(`${year}년 데이터 호출 에러:`, err);
          setResidentsByYear((prev) => ({ ...prev, [year]: [] }));
        });
    });
  }, []);

  useEffect(() => {
    if (currentView !== "slider") return; // 검색 화면일 때는 슬라이드 타이머 중지

    // 스크롤될 시간을 충분히 주기 위해 5초 -> 15초(15000ms)로 대기 시간 연장
    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        setPrevIndex(prev);
        return (prev + 1) % yearsList.length;
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
    setIsMenuOpen(false);
    if (view === "admin") {
      setAdminPinInput("");
      setShowAdminModal(true);
      return;
    }
    setCurrentView(view);
    if (view !== "search") {
      setIsKeyboardOpen(false); // 화면 이동 시 키보드 닫기
      setIsShift(false);
    }
  };

  // 가상 키보드 입력 핸들러 (hangul-js 적용)
  const handleKeyPress = (key) => {
    const isSearch = currentView === "search";
    const isAdminList = currentView === "admin-list";

    // 현재 화면에 따라 상태를 업데이트할 대상 지정
    const updateTarget = isSearch
      ? setSearchValue
      : isAdminList
        ? setAdminSearchValue
        : null;
    const targetValue = isSearch
      ? searchValue
      : isAdminList
        ? adminSearchValue
        : "";

    if (!updateTarget) return;

    if (key === "지우기") {
      const strokes = Hangul.disassemble(targetValue);
      strokes.pop();
      updateTarget(Hangul.assemble(strokes));
    } else if (key === "Space") {
      updateTarget((prev) => prev + " ");
    } else if (key === "Shift") {
      setIsShift(!isShift);
    } else if (key === "닫기") {
      setIsKeyboardOpen(false);
      setIsShift(false);
    } else if (key === "한/영") {
      setIsLangKo(!isLangKo);
      setIsShift(false); // 언어 변경 시 Shift 초기화
    } else {
      const strokes = Hangul.disassemble(targetValue);
      strokes.push(key);
      updateTarget(Hangul.assemble(strokes));

      // 문자 입력 후 Shift 자동 해제 (모바일 키보드 방식)
      if (isShift) setIsShift(false);
    }
  };

  // 프로필 카드 클릭 시 팝업 띄우기
  const handleResidentClick = (resident) => {
    setSelectedResident(resident);
    setPinInput("");
    setShowPinModal(true);
  };

  // 고유번호 키패드 입력 핸들러
  const handlePinKey = (key) => {
    if (key === "취소") {
      setShowPinModal(false);
      setPinInput("");
    } else if (key === "지우기") {
      setPinInput((prev) => prev.slice(0, -1));
    } else if (key === "확인") {
      if (pinInput === selectedResident.pin) {
        // 번호 일치 시
        setShowPinModal(false);
        setPinInput("");
        setCurrentView("detail");
        setIsKeyboardOpen(false); // 가상 키보드 닫기
      } else {
        alert("고유번호가 일치하지 않습니다.");
        setPinInput("");
      }
    } else {
      if (pinInput.length < 8) {
        setPinInput((prev) => prev + key);
      }
    }
  };

  // 선택된 회원 삭제 핸들러
  const handleDeleteSelected = () => {
    if (adminSelectedForDelete.length === 0) {
      alert("삭제할 회원을 선택해주세요.");
      return;
    }
    if (window.confirm("정말 삭제하시겠습니까?")) {
      alert(`${adminSelectedForDelete.length}명의 회원이 삭제되었습니다.`);
      setAdminSelectedForDelete([]); // 선택 초기화
      // ※ 실제 환경에서는 여기서 API 호출 및 mockData를 갱신하는 로직이 들어갑니다.
    }
  };

  // 관리자 비밀번호 키패드 입력 핸들러
  const handleAdminPinKey = (key) => {
    if (key === "취소") {
      setShowAdminModal(false);
      setAdminPinInput("");
    } else if (key === "지우기") {
      setAdminPinInput((prev) => prev.slice(0, -1));
    } else if (key === "확인") {
      if (adminPinInput === "1234") {
        // 관리자 비밀번호 일치 시
        setShowAdminModal(false);
        setAdminPinInput("");
        setCurrentView("admin");
        setIsKeyboardOpen(false); // 가상 키보드 닫기
      } else {
        alert("비밀번호가 일치하지 않습니다.");
        setAdminPinInput("");
      }
    } else {
      if (adminPinInput.length < 8) {
        setAdminPinInput((prev) => prev + key);
      }
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

  // 전체 입소자 데이터 배열 (캐시된 모든 연도 데이터 병합)
  const allResidents = Object.values(residentsByYear).flat();

  // 검색어에 따른 입소자 필터링 (모든 연도의 데이터를 합친 후 이름으로 검색)
  const filteredResidents =
    searchValue.trim() === ""
      ? [] // 검색어가 없을 때는 빈 배열 반환
      : allResidents.filter((resident) => resident.name.includes(searchValue));

  // 관리자 회원 조회 데이터 필터링 및 페이지네이션 계산
  const adminFilteredResidents = allResidents.filter(
    (r) =>
      r.name.includes(adminSearchValue) ||
      (r.pin && r.pin.includes(adminSearchValue)) ||
      (r.id && r.id.toString().includes(adminSearchValue)),
  );
  const adminItemsPerPage = 10; // 한 페이지에 보여줄 회원 수를 10명으로 늘림
  const adminTotalPages =
    Math.ceil(adminFilteredResidents.length / adminItemsPerPage) || 1;
  const adminPaginatedResidents = adminFilteredResidents.slice(
    (adminCurrentPage - 1) * adminItemsPerPage,
    adminCurrentPage * adminItemsPerPage,
  );

  return (
    <div className="app-container">
      {currentView === "slider" ? (
        <div className="slider-wrapper">
          {yearsList.map((year, index) => {
            // 슬라이드 애니메이션을 위한 클래스 계산
            let positionClass = "next-slide";
            if (index === currentIndex) {
              positionClass = "active-slide";
            } else if (index === prevIndex) {
              positionClass = "prev-slide";
            }

            const residents = residentsByYear[year];

            return (
              <div key={year} className={`slide ${positionClass}`}>
                <h1 className="year-title">{year}년 입소자</h1>
                <div className="resident-list">
                  {!residents ? (
                    <p className="no-result">데이터를 불러오는 중입니다...</p>
                  ) : residents.length === 0 ? (
                    <p className="no-result">
                      해당 연도의 입소자 데이터가 없습니다.
                    </p>
                  ) : (
                    residents.map((resident) => (
                      <div
                        key={resident.id}
                        className="resident-card"
                        onClick={() => handleResidentClick(resident)}
                      >
                        <img
                          src={resident.image}
                          alt={resident.name}
                          onError={(e) => {
                            e.target.src = "/images/profile.png";
                          }}
                        />
                        <h2 className="resident-name">{resident.name}</h2>
                      </div>
                    ))
                  )}
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

          {/* 검색 결과 영역 */}
          <div className="search-results">
            {searchValue.trim() === "" ? (
              <p className="no-result">검색할 이름을 입력해주세요.</p>
            ) : filteredResidents.length > 0 ? (
              filteredResidents.map((resident) => (
                <div
                  key={resident.id}
                  className="resident-card"
                  onClick={() => handleResidentClick(resident)}
                >
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
              ))
            ) : (
              <p className="no-result">검색 결과가 없습니다.</p>
            )}
          </div>
        </div>
      ) : currentView === "detail" && selectedResident ? (
        <div className="detail-wrapper">
          <div className="detail-top">
            <img
              src={selectedResident.image}
              alt={selectedResident.name}
              className="detail-image"
              onError={(e) => {
                e.target.src = "/images/profile.png";
              }}
            />
            <div className="detail-info">
              <h2>{selectedResident.name}</h2>
              <p>
                <strong>입소 일자 :</strong> {selectedResident.date}
              </p>
              <p>
                <strong>입소 부서 :</strong> {selectedResident.department}
              </p>
            </div>
          </div>
          <div className="detail-bottom">
            <h3>부서원</h3>
            <div className="coworker-list">
              {selectedResident.coworkers &&
              selectedResident.coworkers.length > 0 ? (
                selectedResident.coworkers.map((cw, idx) => (
                  <div key={idx} className="coworker-card">
                    <img
                      src={cw.image}
                      alt={cw.name}
                      onError={(e) => {
                        e.target.src = "/images/profile.png";
                      }}
                    />
                    <span className="coworker-name">{cw.name}</span>
                  </div>
                ))
              ) : (
                <p
                  style={{
                    fontSize: "1.6rem",
                    color: "rgba(255,255,255,0.7)",
                    textAlign: "left",
                    width: "100%",
                  }}
                >
                  부서원이 없습니다.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : currentView === "admin" ? (
        <div className="admin-wrapper">
          <h1 className="admin-header">관리자 페이지</h1>
          <div className="admin-menu-container">
            <button className="admin-menu-btn">회원 등록</button>
            <button
              className="admin-menu-btn"
              onClick={() => setCurrentView("admin-list")}
            >
              회원 조회
            </button>
            <button
              className="admin-menu-btn"
              onClick={() => setCurrentView("slider")}
            >
              종료
            </button>
          </div>
        </div>
      ) : currentView === "admin-list" ? (
        <div className="admin-list-wrapper">
          <div className="admin-list-container">
            <div className="admin-list-header">
              <h2>회원 조회</h2>
              <div className="admin-list-header-actions">
                <button
                  className="admin-delete-btn"
                  onClick={handleDeleteSelected}
                >
                  회원 삭제
                </button>
                <button
                  className="admin-list-close-btn"
                  onClick={() => setCurrentView("admin")}
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="admin-list-search">
              <input
                type="text"
                placeholder="회원 이름 또는 고유번호 검색..."
                value={adminSearchValue}
                onChange={(e) => {
                  setAdminSearchValue(e.target.value);
                  setAdminSelectedForDelete([]); // 검색 시 체크박스 초기화
                  setAdminCurrentPage(1); // 검색 시 첫 페이지로 초기화
                }}
                onFocus={() => setIsKeyboardOpen(true)}
                onClick={() => setIsKeyboardOpen(true)}
                inputMode="none"
              />
            </div>
            <div className="admin-list-content">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: "50px", textAlign: "center" }}>
                      <input
                        type="checkbox"
                        checked={
                          adminPaginatedResidents.length > 0 &&
                          adminPaginatedResidents.every((r) =>
                            adminSelectedForDelete.includes(r.id),
                          )
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            const newSelections = new Set(
                              adminSelectedForDelete,
                            );
                            adminPaginatedResidents.forEach((r) =>
                              newSelections.add(r.id),
                            );
                            setAdminSelectedForDelete(
                              Array.from(newSelections),
                            );
                          } else {
                            setAdminSelectedForDelete(
                              adminSelectedForDelete.filter(
                                (id) =>
                                  !adminPaginatedResidents.find(
                                    (r) => r.id === id,
                                  ),
                              ),
                            );
                          }
                        }}
                      />
                    </th>
                    <th>No.</th>
                    <th>이름</th>
                    <th>고유번호</th>
                    <th>입사 부서</th>
                  </tr>
                </thead>
                <tbody>
                  {adminPaginatedResidents.length > 0 ? (
                    adminPaginatedResidents.map((resident, idx) => (
                      <tr
                        key={resident.id}
                        onClick={() => setAdminSelectedResident(resident)}
                      >
                        <td
                          style={{ textAlign: "center" }}
                          onClick={(e) =>
                            e.stopPropagation()
                          } /* 체크박스 클릭 시 팝업 방지 */
                        >
                          <input
                            type="checkbox"
                            checked={adminSelectedForDelete.includes(
                              resident.id,
                            )}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setAdminSelectedForDelete([
                                  ...adminSelectedForDelete,
                                  resident.id,
                                ]);
                              } else {
                                setAdminSelectedForDelete(
                                  adminSelectedForDelete.filter(
                                    (id) => id !== resident.id,
                                  ),
                                );
                              }
                            }}
                          />
                        </td>
                        <td>
                          {(adminCurrentPage - 1) * adminItemsPerPage + idx + 1}
                        </td>
                        <td>{resident.name}</td>
                        <td>{resident.pin}</td>
                        <td>{resident.department}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="admin-table-empty">
                        검색 결과가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="admin-pagination">
              {Array.from({ length: adminTotalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    className={`admin-page-btn ${page === adminCurrentPage ? "active" : ""}`}
                    onClick={() => setAdminCurrentPage(page)}
                  >
                    {page}
                  </button>
                ),
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* 관리자 회원 정보 수정 팝업 (모달) */}
      {adminSelectedResident && (
        <div className="admin-edit-modal-overlay">
          <div className="admin-edit-modal">
            <h3>회원 정보 수정</h3>
            <div className="admin-edit-body">
              <img
                src={adminSelectedResident.image}
                alt={adminSelectedResident.name}
                onError={(e) => (e.target.src = "/images/profile.png")}
              />
              <div className="admin-edit-form">
                <label>입사 부서</label>
                <input
                  type="text"
                  defaultValue={adminSelectedResident.department}
                />
                <label>입사 일자</label>
                <input type="text" defaultValue={adminSelectedResident.date} />
                <label>부서 변경 이력</label>
                <ul className="admin-edit-history-list">
                  {adminSelectedResident.deptHistory &&
                  adminSelectedResident.deptHistory.length > 0 ? (
                    adminSelectedResident.deptHistory.map((history, idx) => (
                      <li key={idx} className="admin-edit-history-item">
                        <input type="text" defaultValue={history} />
                        <button className="admin-history-del-btn" title="삭제">
                          ✕
                        </button>
                      </li>
                    ))
                  ) : (
                    <li className="admin-edit-history-item">
                      <input type="text" placeholder="이력 없음" />
                    </li>
                  )}
                </ul>
                <button className="admin-history-add-btn">+ 이력 추가</button>
              </div>
            </div>
            <div className="admin-edit-actions">
              <button
                className="admin-edit-cancel"
                onClick={() => setAdminSelectedResident(null)}
              >
                취소
              </button>
              <button
                className="admin-edit-save"
                onClick={() => {
                  alert("회원 정보가 성공적으로 수정되었습니다.");
                  setAdminSelectedResident(null);
                }}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 고유번호 입력 팝업창 (모달) */}
      {showPinModal && selectedResident && (
        <div className="pin-modal-overlay">
          <div className="pin-modal">
            <h2>고유번호 입력</h2>
            <p>{selectedResident.name} 님의 고유번호를 입력해주세요.</p>
            <div className="pin-display">
              {pinInput ? "●".repeat(pinInput.length) : "번호를 입력하세요"}
            </div>
            <div className="pin-keyboard">
              {[
                "1",
                "2",
                "3",
                "4",
                "5",
                "6",
                "7",
                "8",
                "9",
                "취소",
                "0",
                "지우기",
              ].map((key) => (
                <button
                  key={key}
                  className={`pin-key-btn ${["취소", "지우기"].includes(key) ? "action-key" : ""}`}
                  onClick={() => handlePinKey(key)}
                >
                  {key}
                </button>
              ))}
            </div>
            <button
              className="pin-confirm-btn"
              onClick={() => handlePinKey("확인")}
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 관리자 로그인 팝업창 (모달) */}
      {showAdminModal && (
        <div className="pin-modal-overlay">
          <div className="pin-modal">
            <h2>관리자 로그인</h2>
            <p>관리자 비밀번호를 입력해주세요.</p>
            <div className="pin-display">
              {adminPinInput
                ? "●".repeat(adminPinInput.length)
                : "비밀번호 입력"}
            </div>
            <div className="pin-keyboard">
              {[
                "1",
                "2",
                "3",
                "4",
                "5",
                "6",
                "7",
                "8",
                "9",
                "취소",
                "0",
                "지우기",
              ].map((key) => (
                <button
                  key={key}
                  className={`pin-key-btn ${["취소", "지우기"].includes(key) ? "action-key" : ""}`}
                  onClick={() => handleAdminPinKey(key)}
                >
                  {key}
                </button>
              ))}
            </div>
            <button
              className="pin-confirm-btn"
              onClick={() => handleAdminPinKey("확인")}
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 가상 키보드 영역 (검색 및 회원조회 화면에서 공통 사용) */}
      {isKeyboardOpen &&
        (currentView === "search" || currentView === "admin-list") && (
          <>
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
                      onMouseDown={(e) => e.preventDefault()}
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

      {/* 우측 하단 플로팅 메뉴 */}
      {currentView !== "admin" && (
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
            <button
              className="menu-item"
              onClick={() => handleMenuClick("admin")}
            >
              관리자
            </button>
          </div>
          <button className="menu-toggle-btn" onClick={toggleMenu}>
            {isMenuOpen ? "✕" : "☰"}
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
