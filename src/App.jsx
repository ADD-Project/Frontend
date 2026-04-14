import { useState, useEffect } from "react";
import * as Hangul from "hangul-js";
import "./Slider.css";

// 현재 연도 구하기 (기본값용)
const CURRENT_YEAR = new Date().getFullYear();

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
  const [searchResults, setSearchResults] = useState([]); // 검색 API 결과 상태
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false); // 키보드 표시 여부
  const [isLangKo, setIsLangKo] = useState(true); // 한/영 상태
  const [isShift, setIsShift] = useState(false); // Shift 상태 추가
  const [selectedResident, setSelectedResident] = useState(null); // 클릭한 회원 객체
  const [showPinModal, setShowPinModal] = useState(false); // 고유번호 팝업창 표시 여부
  const [pinInput, setPinInput] = useState(""); // 입력된 고유번호
  const [showAdminModal, setShowAdminModal] = useState(false); // 관리자 로그인 팝업창
  const [adminPinInput, setAdminPinInput] = useState(""); // 입력된 관리자 비밀번호
  const [adminSearchValue, setAdminSearchValue] = useState(""); // 관리자 회원 조회 검색어
  const [adminSearchKeyword, setAdminSearchKeyword] = useState(""); // 관리자 회원 조회 검색 적용어
  const [adminCurrentPage, setAdminCurrentPage] = useState(1); // 관리자 페이지네이션
  const [adminSelectedResident, setAdminSelectedResident] = useState(null); // 관리자 화면 회원 수정 팝업용
  const [adminSelectedForDelete, setAdminSelectedForDelete] = useState([]); // 삭제하기 위해 체크된 회원 ID 배열
  const [adminMembersList, setAdminMembersList] = useState([]); // 관리자 회원 조회 API 결과
  const [adminTotalPagesState, setAdminTotalPagesState] = useState(1); // 관리자 API 총 페이지 수
  const [adminCurrentPassword, setAdminCurrentPassword] = useState(""); // 관리자 현재 비밀번호
  const [adminNewPassword, setAdminNewPassword] = useState(""); // 관리자 새 비밀번호
  const [focusedInput, setFocusedInput] = useState(null); // 현재 포커스된 입력창 구분
  const [residentsByYear, setResidentsByYear] = useState({}); // 연도별 입소자 데이터 상태
  const [yearsList, setYearsList] = useState([]); // 조회할 연도 리스트 상태
  const [isIdleModalOpen, setIsIdleModalOpen] = useState(false); // 무반응(유휴) 알림 팝업창 표시 여부
  const [idleCountdown, setIdleCountdown] = useState(5); // 무반응 알림 팝업 카운트다운 숫자

  // 터치 및 휠을 이용한 화면 확대/축소(줌) 방지
  useEffect(() => {
    const handleTouch = (e) => {
      if (e.touches.length > 1) {
        e.preventDefault(); // 두 손가락 터치(핀치 줌) 방지
      }
    };

    const handleWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault(); // Ctrl + 마우스 휠 줌 방지
      }
    };

    // passive: false로 설정해야 e.preventDefault()가 정상적으로 동작함
    document.addEventListener("touchstart", handleTouch, { passive: false });
    document.addEventListener("touchmove", handleTouch, { passive: false });
    document.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      document.removeEventListener("touchstart", handleTouch);
      document.removeEventListener("touchmove", handleTouch);
      document.removeEventListener("wheel", handleWheel);
    };
  }, []);

  // 컴포넌트 마운트 시 전체 연도의 데이터를 비동기로 미리 호출하여 캐싱 (검색 및 슬라이더용)
  useEffect(() => {
    // 1. 먼저 연도 범위를 조회합니다.
    fetch("/api/members/admission-years/range", {
      method: "GET",
    })
      .then((res) => res.json())
      .then((rangeJson) => {
        let start = 1978;
        let end = CURRENT_YEAR;

        if (rangeJson.success && rangeJson.data) {
          start = rangeJson.data.minYear || start;
          end = rangeJson.data.maxYear || end;
        }

        const fetchedYearsList = Array.from(
          { length: end - start + 1 },
          (_, i) => start + i,
        );
        setYearsList(fetchedYearsList);

        // 2. 구해진 연도 범위에 맞춰 개별 연도 데이터를 호출합니다.
        fetchedYearsList.forEach((year) => {
          fetch(`/api/members/admission-years/${year}`, {
            method: "GET",
          })
            .then((res) => res.json())
            .then((json) => {
              if (json.success && json.data) {
                const mappedData = json.data.map((r) => ({
                  year: year,
                  id: r.memberId,
                  name: r.name,
                  image: r.profileImagePath || "/images/profile.png",
                  pin: r.memberCode ? String(r.memberCode) : "", // 실제 회원의 고유번호를 문자로 안전하게 매핑
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
      })
      .catch((err) => {
        console.error("연도 범위 호출 에러:", err);
      });
  }, []);

  // 데이터가 존재하는 연도만 필터링 (초기 로딩 시 화면 터짐 방지를 위해 임시로 올해 연도를 노출)
  const activeYears = yearsList.filter(
    (year) => residentsByYear[year] && residentsByYear[year].length > 0,
  );

  // 1페이지(화면) 당 8명씩 3줄 = 24명 제한
  const ITEMS_PER_PAGE = 24;
  const sliderPages = [];

  if (activeYears.length === 0) {
    sliderPages.push({ year: CURRENT_YEAR, residents: null, pageIndex: 0 });
  } else {
    activeYears.forEach((year) => {
      const yearResidents = residentsByYear[year];
      for (let i = 0; i < yearResidents.length; i += ITEMS_PER_PAGE) {
        sliderPages.push({
          year: year,
          pageIndex: i / ITEMS_PER_PAGE,
          residents: yearResidents.slice(i, i + ITEMS_PER_PAGE),
        });
      }
    });
  }
  const sliderPagesLength = sliderPages.length;

  useEffect(() => {
    if (currentView !== "slider") return; // 검색 화면일 때는 슬라이드 타이머 중지

    // 스크롤될 시간을 충분히 주기 위해 5초 -> 15초(15000ms)로 대기 시간 연장
    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        setPrevIndex(prev);
        return (prev + 1) % sliderPagesLength;
      });
    }, 15000);

    return () => clearInterval(timer);
  }, [currentView, sliderPagesLength]);

  // 슬라이드가 왼쪽으로 완전히 빠진 후(1초 뒤) prevIndex를 초기화하여 오른쪽 대기 상태로 애니메이션 없이 즉시 이동
  useEffect(() => {
    if (prevIndex !== -1) {
      const timeout = setTimeout(() => {
        setPrevIndex(-1);
      }, 1000); // CSS transition 시간(1초)과 동일하게 설정
      return () => clearTimeout(timeout);
    }
  }, [prevIndex]);

  // 검색어 변경 시 회원 검색 API 호출 (디바운스 적용)
  useEffect(() => {
    if (searchValue.trim() === "") {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      fetch(
        `/api/members/search?name=${encodeURIComponent(searchValue.trim())}`,
      )
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data) {
            const mappedData = json.data.map((r) => ({
              id: r.memberId,
              pin: r.memberCode ? String(r.memberCode) : "", // 실제 고유번호 매핑
              name: r.name,
              image: r.profileImagePath || "/images/profile.png",
              department: r.joinDepartmentName || "미배정",
            }));
            setSearchResults(mappedData);
          } else {
            setSearchResults([]);
          }
        })
        .catch((err) => {
          console.error("검색 API 호출 에러:", err);
          setSearchResults([]);
        });
    }, 300); // 0.3초 딜레이 (타이핑 중복 호출 방지)

    return () => clearTimeout(timeoutId);
  }, [searchValue]);

  // 사용자 활동 감지 및 3분 무반응 시 팝업 타이머 설정
  useEffect(() => {
    let idleTimer;

    const resetIdleTimer = () => {
      // 홈 화면이거나 이미 모달이 떠있는 상태면 무시
      if (currentView === "slider" || isIdleModalOpen) return;
      clearTimeout(idleTimer);
      idleTimer = setTimeout(
        () => {
          setIsIdleModalOpen(true);
          setIdleCountdown(5);
        },
        3 * 60 * 1000,
      ); // 3분 (180,000ms)
    };

    if (currentView !== "slider") {
      resetIdleTimer(); // 화면 진입 시 타이머 시작
      window.addEventListener("mousemove", resetIdleTimer);
      window.addEventListener("keydown", resetIdleTimer);
      window.addEventListener("touchstart", resetIdleTimer);
      window.addEventListener("click", resetIdleTimer);
    }

    return () => {
      clearTimeout(idleTimer);
      window.removeEventListener("mousemove", resetIdleTimer);
      window.removeEventListener("keydown", resetIdleTimer);
      window.removeEventListener("touchstart", resetIdleTimer);
      window.removeEventListener("click", resetIdleTimer);
    };
  }, [currentView, isIdleModalOpen]);

  // 팝업 표시 중 1초 단위 카운트다운 및 홈 화면 이동 처리
  useEffect(() => {
    let countdownInterval;
    if (isIdleModalOpen) {
      countdownInterval = setInterval(() => {
        setIdleCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            setIsIdleModalOpen(false);
            setCurrentView("slider");
            setIsMenuOpen(false);
            setIsKeyboardOpen(false);
            setShowPinModal(false);
            setShowAdminModal(false);
            setAdminSelectedResident(null);
            setAdminCurrentPassword("");
            setAdminNewPassword("");
            setSearchValue(""); // 유휴 상태로 홈 복귀 시 일반 검색어 초기화
            setAdminSearchValue(""); // 유휴 상태로 홈 복귀 시 관리자 검색어 초기화
            setAdminSearchKeyword(""); // 유휴 상태로 홈 복귀 시 적용된 검색어 초기화
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(countdownInterval);
  }, [isIdleModalOpen]);

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
    if (view === "search") {
      setSearchValue(""); // 검색 화면으로 진입 시 검색어 초기화
    }
    setCurrentView(view);
    if (view !== "search") {
      setIsKeyboardOpen(false); // 화면 이동 시 키보드 닫기
      setIsShift(false);
      setFocusedInput(null);
    }
  };

  // 가상 키보드 입력 핸들러 (hangul-js 적용)
  const handleKeyPress = (key) => {
    let updateTarget = null;
    let targetValue = "";

    if (focusedInput === "search") {
      updateTarget = setSearchValue;
      targetValue = searchValue;
    } else if (focusedInput === "adminSearch") {
      updateTarget = setAdminSearchValue;
      targetValue = adminSearchValue;
    } else if (focusedInput === "adminCurrentPassword") {
      updateTarget = setAdminCurrentPassword;
      targetValue = adminCurrentPassword;
    } else if (focusedInput === "adminNewPassword") {
      updateTarget = setAdminNewPassword;
      targetValue = adminNewPassword;
    } else {
      // 포커스가 명확하지 않을 때의 기본 동작
      const isSearch = currentView === "search";
      const isAdminList = currentView === "admin-list";
      updateTarget = isSearch
        ? setSearchValue
        : isAdminList
          ? setAdminSearchValue
          : null;
      targetValue = isSearch
        ? searchValue
        : isAdminList
          ? adminSearchValue
          : "";
    }

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
      setFocusedInput(null);
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
    console.log("선택된 회원 데이터 (F12에서 확인):", resident); // 백엔드에서 전달받은 실제 고유번호(pin) 확인용
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
        // 번호 일치 시 API 호출하여 상세 정보 가져오기
        fetch(`/api/member/${selectedResident.id}`)
          .then((res) => res.json())
          .then((json) => {
            if (json.success && json.data) {
              const detailData = json.data;
              setSelectedResident((prev) => ({
                ...prev,
                date: detailData.joinDate,
                department: detailData.joinDepartmentName,
                coworkers: detailData.colleaguesAtJoin
                  ? detailData.colleaguesAtJoin.map((cw) => ({
                      id: cw.memberId,
                      name: cw.name,
                      image: cw.profileImagePath || "/images/profile.png",
                      pin: cw.memberCode ? String(cw.memberCode) : "", // 부서원도 고유번호를 가지도록 추가
                    }))
                  : [],
              }));
              setShowPinModal(false);
              setPinInput("");
              setCurrentView("detail");
              setIsKeyboardOpen(false); // 가상 키보드 닫기
            } else {
              alert("회원 상세 정보를 불러오지 못했습니다.");
              setPinInput("");
            }
          })
          .catch((err) => {
            console.error("상세 정보 호출 에러:", err);
            alert("상세 정보를 불러오는 중 오류가 발생했습니다.");
            setPinInput("");
          });
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
      fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: adminPinInput }),
      })
        .then((res) => res.json())
        .then((json) => {
          if (json.success) {
            setShowAdminModal(false);
            setAdminPinInput("");
            setCurrentView("admin");
            setIsKeyboardOpen(false); // 가상 키보드 닫기
          } else {
            alert("비밀번호가 일치하지 않습니다.");
            setAdminPinInput("");
          }
        })
        .catch((err) => {
          console.error("관리자 로그인 에러:", err);
          alert("관리자 로그인 중 오류가 발생했습니다.");
          setAdminPinInput("");
        });
    } else {
      if (adminPinInput.length < 8) {
        setAdminPinInput((prev) => prev + key);
      }
    }
  };

  // 관리자 회원 조회 API 호출
  const fetchAdminMembers = (page, keyword) => {
    const pageParam = page - 1; // Spring Boot(Pageable)는 기본적으로 0-based page 사용
    let url = `/api/admin/members?page=${pageParam}&size=10`;
    if (keyword) {
      url += `&keyword=${encodeURIComponent(keyword)}`; // 백엔드 검색 구현에 맞춰 파라미터 추가
    }

    fetch(url)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          const mappedData = json.data.content.map((r) => ({
            id: r.memberId,
            pin: r.memberCode || "",
            name: r.name,
            image: r.profileImagePath || "/images/profile.png",
            department: r.joinDepartmentName || "미배정",
            deptHistory: [], // 필요 시 이력 추가
          }));
          setAdminMembersList(mappedData);
          setAdminTotalPagesState(
            json.data.totalPages === 0 ? 1 : json.data.totalPages,
          );
        } else {
          setAdminMembersList([]);
          setAdminTotalPagesState(1);
        }
      })
      .catch((err) => {
        console.error("관리자 회원 조회 에러:", err);
        setAdminMembersList([]);
        setAdminTotalPagesState(1);
      });
  };

  // 관리자 회원 상세 조회 API 호출
  const fetchAdminMemberDetail = (id) => {
    fetch(`/api/admin/members/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          const d = json.data;
          setAdminSelectedResident({
            id: id,
            name: d.name,
            image: d.profileImagePath || "/images/profile.png",
            department: d.joinDepartmentName || "",
            date: d.joinDate || "",
            // 부서 변경 이력을 보기 좋게 문자열 배열로 가공
            deptHistory: d.departmentHistories
              ? d.departmentHistories.map(
                  (h) => `[${h.startDate}] ${h.departmentName}`,
                )
              : [],
          });
          setAdminCurrentPassword(""); // 모달 열 때 비밀번호 입력 초기화
          setAdminNewPassword("");
        } else {
          alert("회원 상세 정보를 불러오지 못했습니다.");
        }
      })
      .catch((err) => {
        console.error("관리자 회원 상세 조회 에러:", err);
        alert("상세 정보를 불러오는 중 오류가 발생했습니다.");
      });
  };

  // 현재 상태에 맞는 키보드 레이아웃 선택
  const currentKeyboardLayout = isLangKo
    ? isShift
      ? keyboardLayouts.koShift
      : keyboardLayouts.ko
    : isShift
      ? keyboardLayouts.enShift
      : keyboardLayouts.en;

  const adminItemsPerPage = 10; // 한 페이지에 보여줄 회원 수를 10명으로 유지 (API 사이즈와 맞춤)

  return (
    <div className="app-container">
      {/* 우측 상단 고정 로고 (관리자 관련 화면에서는 숨김) */}
      {currentView !== "admin" && currentView !== "admin-list" && (
        <div className="top-right-container">
          <img
            src="/images/국방과학연구소 로고_국문.png"
            alt="국방과학연구소 로고"
            className="top-right-logo"
          />
          <div className="top-right-text">
            <div className="text-main">제 5 기술연구원</div>
            <div className="text-sub">
              The 5th Technology Research Institute
            </div>
          </div>
        </div>
      )}

      {currentView === "slider" ? (
        <div className="slider-wrapper">
          {sliderPages.map((page, index) => {
            // 슬라이드 애니메이션을 위한 클래스 계산
            let positionClass = "next-slide";
            if (index === currentIndex) {
              positionClass = "active-slide";
            } else if (index === prevIndex) {
              positionClass = "prev-slide";
            }

            return (
              <div
                key={`${page.year}-${page.pageIndex}`}
                className={`slide ${positionClass}`}
              >
                <h1 className="year-title">
                  {page.year}년 입소자{" "}
                  {page.pageIndex > 0 ? `(${page.pageIndex + 1}p)` : ""}
                </h1>
                <div className="resident-list">
                  {!page.residents ? (
                    <p className="no-result">데이터를 불러오는 중입니다...</p>
                  ) : page.residents.length === 0 ? (
                    <p className="no-result">
                      해당 연도의 입소자 데이터가 없습니다.
                    </p>
                  ) : (
                    page.residents.map((resident) => (
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
              onFocus={() => {
                setIsKeyboardOpen(true);
                setFocusedInput("search");
              }}
              onClick={() => {
                setIsKeyboardOpen(true);
                setFocusedInput("search");
              }}
              inputMode="none" /* 모바일/OS 기본 터치 키보드가 올라오는 것을 방지 */
            />
            <button
              className="search-btn"
              onClick={() => {
                setIsKeyboardOpen(false);
                setFocusedInput(null);
              }}
            >
              검색
            </button>
          </div>

          {/* 검색 결과 영역 */}
          <div className="search-results">
            {searchValue.trim() === "" ? (
              <p className="no-result">검색할 이름을 입력해주세요.</p>
            ) : searchResults.length > 0 ? (
              searchResults.map((resident) => (
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
                selectedResident.coworkers.map((cw) => (
                  <div
                    key={cw.id}
                    className="coworker-card"
                    onClick={() => handleResidentClick(cw)}
                  >
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
            <button className="admin-menu-btn">부서 조회</button>
            <button
              className="admin-menu-btn"
              onClick={() => {
                setAdminSearchValue(""); // 관리자 회원 조회 진입 시 검색어 초기화
                setAdminSearchKeyword(""); // 적용된 검색어도 초기화
                setAdminCurrentPage(1); // 페이지도 1페이지로 초기화
                setCurrentView("admin-list");
                fetchAdminMembers(1, ""); // 진입 시 전체 조회 API 호출
              }}
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
                }}
                onFocus={() => {
                  setIsKeyboardOpen(true);
                  setFocusedInput("adminSearch");
                }}
                onClick={() => {
                  setIsKeyboardOpen(true);
                  setFocusedInput("adminSearch");
                }}
                inputMode="none"
              />
              <button
                className="admin-search-btn"
                onClick={() => {
                  setAdminSearchKeyword(adminSearchValue); // 검색 버튼 클릭 시 필터 적용
                  setAdminSelectedForDelete([]); // 체크박스 초기화
                  setAdminCurrentPage(1); // 첫 페이지로 초기화
                  setIsKeyboardOpen(false); // 키보드 닫기
                  fetchAdminMembers(1, adminSearchValue); // 검색 시 API 호출
                }}
              >
                검색
              </button>
            </div>
            <div className="admin-list-content">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: "50px", textAlign: "center" }}>
                      <input
                        type="checkbox"
                        checked={
                          adminMembersList.length > 0 &&
                          adminMembersList.every((r) =>
                            adminSelectedForDelete.includes(r.id),
                          )
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            const newSelections = new Set(
                              adminSelectedForDelete,
                            );
                            adminMembersList.forEach((r) =>
                              newSelections.add(r.id),
                            );
                            setAdminSelectedForDelete(
                              Array.from(newSelections),
                            );
                          } else {
                            setAdminSelectedForDelete(
                              adminSelectedForDelete.filter(
                                (id) =>
                                  !adminMembersList.find((r) => r.id === id),
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
                  {adminMembersList.length > 0 ? (
                    adminMembersList.map((resident, idx) => (
                      <tr
                        key={resident.id}
                        onClick={() => fetchAdminMemberDetail(resident.id)}
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
              {Array.from(
                { length: adminTotalPagesState },
                (_, i) => i + 1,
              ).map((page) => (
                <button
                  key={page}
                  className={`admin-page-btn ${page === adminCurrentPage ? "active" : ""}`}
                  onClick={() => {
                    setAdminCurrentPage(page);
                    fetchAdminMembers(page, adminSearchKeyword); // 페이지 이동 시 API 재호출
                  }}
                >
                  {page}
                </button>
              ))}
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
                {adminSelectedResident.id === 1 ? (
                  <>
                    <label>현재 비밀번호</label>
                    <input
                      type="password"
                      placeholder="현재 비밀번호 입력"
                      value={adminCurrentPassword}
                      onChange={(e) => setAdminCurrentPassword(e.target.value)}
                      onFocus={() => {
                        setIsKeyboardOpen(true);
                        setFocusedInput("adminCurrentPassword");
                      }}
                      onClick={() => {
                        setIsKeyboardOpen(true);
                        setFocusedInput("adminCurrentPassword");
                      }}
                      inputMode="none"
                    />
                    <label>새 비밀번호</label>
                    <input
                      type="password"
                      placeholder="영문, 숫자 포함 8자리 이상"
                      value={adminNewPassword}
                      onChange={(e) => setAdminNewPassword(e.target.value)}
                      onFocus={() => {
                        setIsKeyboardOpen(true);
                        setFocusedInput("adminNewPassword");
                      }}
                      onClick={() => {
                        setIsKeyboardOpen(true);
                        setFocusedInput("adminNewPassword");
                      }}
                      inputMode="none"
                    />
                  </>
                ) : (
                  <>
                    <label>입사 부서</label>
                    <input
                      type="text"
                      defaultValue={adminSelectedResident.department}
                    />
                    <label>입사 일자</label>
                    <input
                      type="text"
                      defaultValue={adminSelectedResident.date}
                    />
                    <label>부서 변경 이력</label>
                    <ul className="admin-edit-history-list">
                      {adminSelectedResident.deptHistory &&
                      adminSelectedResident.deptHistory.length > 0 ? (
                        adminSelectedResident.deptHistory.map(
                          (history, idx) => (
                            <li key={idx} className="admin-edit-history-item">
                              <input type="text" defaultValue={history} />
                              <button
                                className="admin-history-del-btn"
                                title="삭제"
                              >
                                ✕
                              </button>
                            </li>
                          ),
                        )
                      ) : (
                        <li className="admin-edit-history-item">
                          <input type="text" placeholder="이력 없음" />
                        </li>
                      )}
                    </ul>
                    <button className="admin-history-add-btn">
                      + 이력 추가
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="admin-edit-actions">
              <button
                className="admin-edit-cancel"
                onClick={() => {
                  setAdminSelectedResident(null);
                  setAdminCurrentPassword("");
                  setAdminNewPassword("");
                  setIsKeyboardOpen(false);
                  setFocusedInput(null);
                }}
              >
                취소
              </button>
              <button
                className="admin-edit-save"
                onClick={() => {
                  if (adminSelectedResident.id === 1) {
                    // 관리자 비밀번호 변경 로직
                    if (!adminCurrentPassword) {
                      alert("현재 비밀번호를 입력해주세요.");
                      return;
                    }
                    // 영문 + 숫자 8자리 이상 체크
                    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/;
                    if (!passwordRegex.test(adminNewPassword)) {
                      alert(
                        "새 비밀번호는 영문과 숫자를 포함하여 8자리 이상이어야 합니다.",
                      );
                      return;
                    }

                    fetch("/api/admin/password", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        currentPassword: adminCurrentPassword,
                        newPassword: adminNewPassword,
                      }),
                    })
                      .then((res) => res.json())
                      .then((json) => {
                        if (json.success) {
                          alert("관리자 비밀번호가 성공적으로 변경되었습니다.");
                          setAdminSelectedResident(null);
                          setAdminCurrentPassword("");
                          setAdminNewPassword("");
                          setIsKeyboardOpen(false);
                          setFocusedInput(null);
                        } else {
                          alert(
                            json.message || "비밀번호 변경에 실패했습니다.",
                          );
                        }
                      })
                      .catch((err) => {
                        console.error("비밀번호 변경 에러:", err);
                        alert("비밀번호 변경 중 오류가 발생했습니다.");
                      });
                  } else {
                    // 일반 회원 정보 수정 로직
                    alert("회원 정보가 성공적으로 수정되었습니다.");
                    setAdminSelectedResident(null);
                    setIsKeyboardOpen(false);
                    setFocusedInput(null);
                  }
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
              onClick={() => {
                setIsKeyboardOpen(false);
                setFocusedInput(null);
              }}
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

      {/* 유휴 상태 알림 팝업창 (모달) */}
      {isIdleModalOpen && (
        <div className="idle-modal-overlay">
          <div className="idle-modal">
            <h2>알림</h2>
            <p>
              일정 시간 동안 움직임이 없어
              <br />홈 화면으로 이동합니다.
            </p>
            <div className="idle-countdown">{idleCountdown}</div>
            <button
              className="idle-cancel-btn"
              onClick={() => setIsIdleModalOpen(false)}
            >
              취소
            </button>
          </div>
        </div>
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
