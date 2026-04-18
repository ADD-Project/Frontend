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

// 홈 화면 슬라이드 순서 설정
// 1. 연도별 임용자 슬라이드 이전에 나올 이미지들
//    - 여기에 추가하는 순서대로 표시됩니다.
//    - 이미지가 없으면 이 부분을 빈 배열 []로 만드세요.
const PRE_RESIDENT_IMAGES = [
  "/images/pages/1.png",
  // 예: 나중에 2번 이미지를 추가하려면 "/images/pages/2.png" 를 이 아래에 추가하시면 됩니다.
];

// 2. 확인할 동영상 경로
//    - 파일이 실제로 존재하는지 내부적으로 자동 검사하여 존재할 때만 실행합니다.
const POST_RESIDENT_VIDEO = "/images/pages/4.mp4";

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
  const [allDepartments, setAllDepartments] = useState([]); // 전체 부서 목록 (클라이언트 필터링용)
  const [departmentList, setDepartmentList] = useState([]); // 필터링 및 페이지네이션된 부서 목록 상태
  const [deptSearchValue, setDeptSearchValue] = useState(""); // 부서 조회 검색어
  const [deptSearchKeyword, setDeptSearchKeyword] = useState(""); // 부서 조회 검색 적용어
  const [deptCurrentPage, setDeptCurrentPage] = useState(1); // 부서 페이지네이션
  const [deptTotalPages, setDeptTotalPages] = useState(1); // 부서 API 총 페이지 수
  const [deptSelectedForDelete, setDeptSelectedForDelete] = useState([]); // 삭제하기 위해 체크된 부서 ID 배열
  const [isDeptAddModalOpen, setIsDeptAddModalOpen] = useState(false); // 부서 추가 모달 표시 여부
  const [newDeptCode, setNewDeptCode] = useState(""); // 새 부서코드
  const [newDeptName, setNewDeptName] = useState(""); // 새 부서명
  const [newDeptStartDate, setNewDeptStartDate] = useState(""); // 새 부서 시작일자
  const [deptExcelFile, setDeptExcelFile] = useState(null); // 부서 추가용 엑셀 파일 상태
  const [memberAddName, setMemberAddName] = useState(""); // 소원 등록 - 이름
  const [memberAddCode, setMemberAddCode] = useState(""); // 소원 등록 - 고유번호
  const [memberAddJoinDate, setMemberAddJoinDate] = useState(""); // 소원 등록 - 입소일자
  const [memberAddJoinDept, setMemberAddJoinDept] = useState(null); // 소원 등록 - 입소부서 객체
  const [memberAddHistories, setMemberAddHistories] = useState([]); // 소원 등록 - 부서 이동 이력 배열
  const [memberAddExcelFile, setMemberAddExcelFile] = useState(null); // 소원 등록용 엑셀 파일 상태
  const [isDeptSearchModalOpen, setIsDeptSearchModalOpen] = useState(false); // 부서 검색 팝업 모달
  const [deptSearchTargetIndex, setDeptSearchTargetIndex] = useState(-1); // -1: 입소부서, 0이상: 이력 배열 인덱스
  const [deptSearchKeywordLocal, setDeptSearchKeywordLocal] = useState(""); // 부서 검색 모달 안의 검색어
  const [focusedInput, setFocusedInput] = useState(null); // 현재 포커스된 입력창 구분
  const [residentsByYear, setResidentsByYear] = useState({}); // 연도별 임용자 데이터 상태
  const [yearsList, setYearsList] = useState([]); // 조회할 연도 리스트 상태
  const [isIdleModalOpen, setIsIdleModalOpen] = useState(false); // 무반응(유휴) 알림 팝업창 표시 여부
  const [idleCountdown, setIdleCountdown] = useState(5); // 무반응 알림 팝업 카운트다운 숫자
  const [isVideoAvailable, setIsVideoAvailable] = useState(false); // 동영상 실제 존재 여부 상태

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

  // 컴포넌트 마운트 시 동영상 파일 존재 여부 자동 확인
  useEffect(() => {
    if (POST_RESIDENT_VIDEO) {
      // 파일 다운로드 없이 헤더만 요청하여 존재 여부(200 OK)를 빠르게 판단합니다.
      fetch(POST_RESIDENT_VIDEO, { method: "HEAD" })
        .then((res) => {
          const contentType = res.headers.get("content-type") || "";
          // SPA 환경 특성상 404 에러 대신 index.html이 반환되는 것을 방지하기 위해 html 응답인지 확인
          if (res.ok && !contentType.includes("text/html")) {
            setIsVideoAvailable(true);
          } else {
            setIsVideoAvailable(false);
          }
        })
        .catch((err) => {
          setIsVideoAvailable(false); // 네트워크 에러나 파일이 없는 경우 건너뜀
        });
    }
  }, []);

  // 데이터가 존재하는 연도만 필터링 (초기 로딩 시 화면 터짐 방지를 위해 임시로 올해 연도를 노출)
  const activeYears = yearsList.filter(
    (year) => residentsByYear[year] && residentsByYear[year].length > 0,
  );

  // 1페이지(화면) 당 8명씩 3줄 = 24명 제한
  const ITEMS_PER_PAGE = 24;
  const sliderPages = [];

  // 1. 설정된 이미지들을 순서대로 추가
  PRE_RESIDENT_IMAGES.forEach((src) => {
    sliderPages.push({ type: "image", src: src });
  });

  // 2. 연도별 임용자 데이터 추가
  if (activeYears.length === 0) {
    sliderPages.push({
      type: "residents",
      year: CURRENT_YEAR,
      residents: null,
      pageIndex: 0,
    });
  } else {
    activeYears.forEach((year) => {
      const yearResidents = residentsByYear[year];
      for (let i = 0; i < yearResidents.length; i += ITEMS_PER_PAGE) {
        sliderPages.push({
          type: "residents",
          year: year,
          pageIndex: i / ITEMS_PER_PAGE,
          residents: yearResidents.slice(i, i + ITEMS_PER_PAGE),
        });
      }
    });
  }

  // 3. 설정된 동영상이 실제로 서버(폴더)에 존재함이 확인되면 마지막에 추가
  if (POST_RESIDENT_VIDEO && isVideoAvailable) {
    sliderPages.push({ type: "video", src: POST_RESIDENT_VIDEO });
  }

  const sliderPagesLength = sliderPages.length;
  const currentPageType = sliderPages[currentIndex]?.type;

  // 슬라이더 논리적 단계(도트) 계산
  const sliderDots = [];
  let hasResidentsDot = false;
  sliderPages.forEach((page, index) => {
    if (page.type === "residents") {
      if (!hasResidentsDot) {
        sliderDots.push({ startIndex: index, type: "residents" });
        hasResidentsDot = true;
      }
    } else {
      // 이미지, 비디오 등은 각각 하나의 도트로 간주
      sliderDots.push({ startIndex: index, type: page.type });
    }
  });

  // 현재 화면이 어느 논리적 단계(도트)에 속하는지 확인
  let activeDotIndex = 0;
  for (let i = 0; i < sliderDots.length; i++) {
    if (currentIndex >= sliderDots[i].startIndex) {
      activeDotIndex = i;
    } else {
      break;
    }
  }

  useEffect(() => {
    if (currentView !== "slider") return; // 검색 화면일 때는 슬라이드 타이머 중지

    // 현재 슬라이드가 동영상인 경우 타이머를 무시 (동영상 onEnded 이벤트에서 다음으로 이동)
    if (currentPageType === "video") return;

    // 스크롤될 시간을 충분히 주기 위해 15초(15000ms) 대기
    const timer = setTimeout(() => {
      setCurrentIndex((prev) => {
        setPrevIndex(prev);
        return (prev + 1) % sliderPagesLength;
      });
    }, 15000);

    return () => clearTimeout(timer);
  }, [currentView, currentIndex, sliderPagesLength, currentPageType]);

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
              year: r.admissionYear, // 임용 연도 데이터 매핑
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
            setIsDeptAddModalOpen(false); // 부서 추가 모달 닫기
            setNewDeptCode("");
            setNewDeptName("");
            setNewDeptStartDate("");
            setDeptExcelFile(null);
            setMemberAddName("");
            setMemberAddCode("");
            setMemberAddJoinDate("");
            setMemberAddJoinDept(null);
            setMemberAddHistories([]);
            setMemberAddExcelFile(null);
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
    } else if (focusedInput === "deptSearch") {
      updateTarget = setDeptSearchValue;
      targetValue = deptSearchValue;
    } else if (focusedInput === "newDeptCode") {
      updateTarget = setNewDeptCode;
      targetValue = newDeptCode;
    } else if (focusedInput === "newDeptName") {
      updateTarget = setNewDeptName;
      targetValue = newDeptName;
    } else if (focusedInput === "adminCurrentPassword") {
      updateTarget = setAdminCurrentPassword;
      targetValue = adminCurrentPassword;
    } else if (focusedInput === "adminNewPassword") {
      updateTarget = setAdminNewPassword;
      targetValue = adminNewPassword;
    } else if (focusedInput === "adminLogin") {
      updateTarget = setAdminPinInput;
      targetValue = adminPinInput;
    } else if (focusedInput === "memberAddName") {
      updateTarget = setMemberAddName;
      targetValue = memberAddName;
    } else if (focusedInput === "memberAddCode") {
      updateTarget = setMemberAddCode;
      targetValue = memberAddCode;
    } else if (focusedInput === "deptSearchKeywordLocal") {
      updateTarget = setDeptSearchKeywordLocal;
      targetValue = deptSearchKeywordLocal;
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
    console.log("선택된 소원 데이터 (F12에서 확인):", resident); // 백엔드에서 전달받은 실제 고유번호(pin) 확인용
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
              alert("소원 상세 정보를 불러오지 못했습니다.");
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
  const handleDeleteSelected = async () => {
    if (adminSelectedForDelete.length === 0) {
      alert("삭제할 소원을 선택해주세요.");
      return;
    }
    if (window.confirm("정말 삭제하시겠습니까?")) {
      try {
        const deletePromises = adminSelectedForDelete.map((id) =>
          fetch(`/api/admin/members/${id}`, {
            method: "DELETE",
          }).then((res) => res.json()),
        );

        const results = await Promise.all(deletePromises);
        const hasError = results.some((result) => !result.success);

        if (hasError) {
          alert("일부 소원 삭제에 실패했습니다.");
        } else {
          alert(`${adminSelectedForDelete.length}명의 소원이 삭제되었습니다.`);
        }

        fetchAdminMembers(adminCurrentPage, adminSearchKeyword); // 삭제 후 목록 최신화
        setAdminSelectedForDelete([]); // 선택 초기화
      } catch (err) {
        console.error("소원 삭제 API 에러:", err);
        alert("소원 삭제 중 오류가 발생했습니다.");
      }
    }
  };

  // 선택된 부서 삭제 핸들러
  const handleDeleteDeptSelected = async () => {
    if (deptSelectedForDelete.length === 0) {
      alert("삭제할 부서를 선택해주세요.");
      return;
    }
    if (window.confirm("정말 삭제하시겠습니까?")) {
      try {
        const deletePromises = deptSelectedForDelete.map((id) =>
          fetch(`/api/departments/${id}`, {
            method: "DELETE",
          }).then((res) => res.json()),
        );

        const results = await Promise.all(deletePromises);
        const hasError = results.some((result) => !result.success);

        if (hasError) {
          alert("일부 부서 삭제에 실패했습니다.");
        } else {
          alert(`${deptSelectedForDelete.length}개의 부서가 삭제되었습니다.`);
        }

        fetchDepartments(); // 삭제 후 목록 최신화
        setDeptSelectedForDelete([]); // 선택 초기화
      } catch (err) {
        console.error("부서 삭제 API 에러:", err);
        alert("부서 삭제 중 오류가 발생했습니다.");
      }
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

  // 부서 목록 조회 API 호출
  const fetchDepartments = () => {
    fetch("/api/departments")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setAllDepartments(json.data);
        } else {
          setAllDepartments([]);
          alert("부서 목록을 불러오는데 실패했습니다.");
        }
      })
      .catch((err) => {
        console.error("부서 조회 API 에러:", err);
        setAllDepartments([]);
        alert("부서 목록을 불러오는 중 오류가 발생했습니다.");
      });
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
        console.error("관리자 소원 조회 에러:", err);
        setAdminMembersList([]);
        setAdminTotalPagesState(1);
      });
  };

  // 부서 목록 클라이언트 측 필터링 및 페이지네이션
  useEffect(() => {
    if (currentView !== "admin-dept-list") return;

    const filtered = allDepartments.filter(
      (dept) =>
        dept.deptName.includes(deptSearchKeyword) ||
        dept.deptCd.includes(deptSearchKeyword),
    );

    const DEPT_ITEMS_PER_PAGE = 10;
    const totalPages = Math.ceil(filtered.length / DEPT_ITEMS_PER_PAGE);
    setDeptTotalPages(totalPages > 0 ? totalPages : 1);

    // 현재 페이지가 총 페이지 수보다 크면 마지막 페이지로 조정
    const newCurrentPage = Math.min(
      deptCurrentPage,
      totalPages > 0 ? totalPages : 1,
    );
    if (deptCurrentPage !== newCurrentPage) setDeptCurrentPage(newCurrentPage);

    const startIndex = (newCurrentPage - 1) * DEPT_ITEMS_PER_PAGE;
    const endIndex = startIndex + DEPT_ITEMS_PER_PAGE;
    setDepartmentList(filtered.slice(startIndex, endIndex));
  }, [allDepartments, deptSearchKeyword, deptCurrentPage, currentView]);

  // 관리자 회원 상세 조회 API 호출
  const fetchAdminMemberDetail = (id) => {
    fetch(`/api/admin/members/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          const d = json.data;
          const historiesData = d.histories || d.departmentHistories || [];
          setAdminSelectedResident({
            id: id,
            pin: d.memberCode || "",
            name: d.name,
            image: d.profileImagePath || "/images/profile.png",
            department: d.joinDepartmentName || "",
            date: d.joinDate || "",
            // 부서 변경 이력을 객체 배열로 가공 (부서 검색/날짜 선택을 위해)
            deptHistory: historiesData.map((h) => ({
              deptCode: h.deptCode || h.departmentCode || "",
              deptName: h.deptName || h.departmentName || "",
              startDate: h.startDate || "",
            })),
          });
          setAdminCurrentPassword(""); // 모달 열 때 비밀번호 입력 초기화
          setAdminNewPassword("");
        } else {
          alert("소원 상세 정보를 불러오지 못했습니다.");
        }
      })
      .catch((err) => {
        console.error("관리자 소원 상세 조회 에러:", err);
        alert("상세 정보를 불러오는 중 오류가 발생했습니다.");
      });
  };

  // 소원 등록 저장 API 호출
  const handleSaveMemberAdd = () => {
    // 1. 엑셀 파일이 등록된 경우 엑셀 업로드 API 우선 호출
    if (memberAddExcelFile) {
      const formData = new FormData();
      formData.append("file", memberAddExcelFile);

      fetch("/api/admin/import/files", {
        method: "POST",
        body: formData, // 브라우저가 자동으로 multipart/form-data 및 boundary 설정
      })
        .then((res) => res.json())
        .then((json) => {
          if (json.success) {
            alert("엑셀 파일을 통해 소원이 성공적으로 등록되었습니다.");
            setCurrentView("admin");
          } else {
            alert(json.message || "엑셀 업로드에 실패했습니다.");
          }
        })
        .catch((err) => {
          console.error("소원 엑셀 업로드 에러:", err);
          alert("소원 엑셀 업로드 중 오류가 발생했습니다.");
        });
      return;
    }

    // 2. 수동 입력일 경우 빈 값 체크 및 단일 등록 API 호출
    if (
      !memberAddCode ||
      !memberAddName ||
      !memberAddJoinDept ||
      !memberAddJoinDate
    ) {
      alert("고유번호, 이름, 입소일자, 입소부서는 필수 입력값입니다.");
      return;
    }

    // 이력 첫 번째 항목은 입소 부서 정보
    const histories = [
      {
        deptCode: memberAddJoinDept.deptCd,
        deptName: memberAddJoinDept.deptName,
        startDate: memberAddJoinDate,
      },
    ];

    // 추가된 이동 이력 병합 (입력된 것만)
    memberAddHistories.forEach((h) => {
      if (h.deptCode && h.startDate) {
        histories.push({
          deptCode: h.deptCode,
          deptName: h.deptName,
          startDate: h.startDate,
        });
      }
    });

    const payload = {
      memberCode: memberAddCode,
      name: memberAddName,
      profileImagePath: "/images/profile.png", // 기본 프로필 이미지 경로
      histories: histories,
    };

    fetch("/api/admin/import/single", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          alert("소원 등록이 성공적으로 완료되었습니다.");
          setCurrentView("admin");
        } else {
          alert(json.message || "소원 등록에 실패했습니다.");
        }
      })
      .catch((err) => {
        console.error("소원 등록 에러:", err);
        alert("소원 등록 중 오류가 발생했습니다.");
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

  // 1번(첫 번째) 슬라이드가 화면에 보이고 있는지 여부 확인
  const isFirstSlide = currentView === "slider" && currentIndex === 0;

  return (
    <div className="app-container">
      {/* 우측 상단 고정 로고 (관리자 관련 화면에서는 숨김) */}
      {currentView !== "admin" &&
        currentView !== "admin-list" &&
        currentView !== "admin-dept-list" &&
        currentView !== "admin-member-add" && (
          <div
            className={`top-right-container ${isFirstSlide ? "hidden" : ""}`}
          >
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
                key={
                  page.type === "residents"
                    ? `${page.year}-${page.pageIndex}`
                    : `media-${index}`
                }
                className={`slide ${positionClass} ${index === 0 ? "black-bg" : ""}`}
              >
                {page.type === "image" && (
                  <img
                    src={page.src}
                    alt={`slide-${index}`}
                    className="slide-full-media"
                  />
                )}

                {page.type === "video" && (
                  <video
                    src={page.src}
                    className="slide-full-media"
                    muted
                    autoPlay={index === currentIndex}
                    ref={(el) => {
                      // 슬라이드가 활성화 될 때마다 동영상을 처음부터 다시 재생하도록 처리
                      if (el && index === currentIndex && el.paused) {
                        el.currentTime = 0;
                        el.play().catch((e) =>
                          console.error("동영상 자동재생 에러:", e),
                        );
                      } else if (el && index !== currentIndex && !el.paused) {
                        el.pause();
                      }
                    }}
                    onEnded={() => {
                      if (index === currentIndex) {
                        setCurrentIndex((prev) => {
                          setPrevIndex(prev);
                          return (prev + 1) % sliderPagesLength;
                        });
                      }
                    }}
                    onError={(e) => {
                      console.error(
                        "동영상 로드 에러 (파일이 없거나 지원하지 않는 형식):",
                        e,
                      );
                      if (index === currentIndex) {
                        setCurrentIndex((prev) => {
                          setPrevIndex(prev);
                          return (prev + 1) % sliderPagesLength;
                        });
                      }
                    }}
                  />
                )}

                {page.type === "residents" && (
                  <>
                    <h1 className="year-title">
                      {page.year}년 임용자{" "}
                      {page.pageIndex > 0 ? `(${page.pageIndex + 1}p)` : ""}
                    </h1>
                    <div className="resident-list">
                      {!page.residents ? (
                        <p className="no-result">
                          데이터를 불러오는 중입니다...
                        </p>
                      ) : page.residents.length === 0 ? (
                        <p className="no-result">
                          해당 연도의 임용자 데이터가 없습니다.
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
                  </>
                )}
              </div>
            );
          })}

          {/* 하단 페이지네이션(동그라미) 영역 */}
          <div className="slider-pagination">
            {sliderDots.map((dot, index) => (
              <button
                key={`dot-${index}`}
                className={`slider-dot ${index === activeDotIndex ? "active" : ""}`}
                onClick={() => {
                  if (index !== activeDotIndex) {
                    setPrevIndex(currentIndex);
                    setCurrentIndex(dot.startIndex);
                  }
                }}
              />
            ))}
          </div>
        </div>
      ) : currentView === "search" ? (
        <div className="search-wrapper">
          <div className="search-header">
            <input
              type="text"
              className="search-input"
              placeholder="임용자 이름 검색..."
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
                  {resident.year && (
                    <p className="resident-year">{resident.year}년도 임용</p>
                  )}
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
                <strong>임용 일자 :</strong> {selectedResident.date}
              </p>
              <p>
                <strong>임용 부서 :</strong> {selectedResident.department}
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
            <button
              className="admin-menu-btn"
              onClick={() => {
                setMemberAddName("");
                setMemberAddCode("");
                setMemberAddJoinDate("");
                setMemberAddJoinDept(null);
                setMemberAddHistories([]);
                setMemberAddExcelFile(null);
                fetchDepartments(); // 부서 검색 팝업을 위해 부서 리스트 미리 조회
                setCurrentView("admin-member-add");
              }}
            >
              소원 등록
            </button>
            <button
              className="admin-menu-btn"
              onClick={() => {
                setDeptSearchValue("");
                setDeptSearchKeyword("");
                setDeptCurrentPage(1);
                setDeptSelectedForDelete([]);
                fetchDepartments();
                setCurrentView("admin-dept-list");
              }}
            >
              부서 조회
            </button>
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
              소원 조회
            </button>
            <button
              className="admin-menu-btn"
              onClick={() => setCurrentView("slider")}
            >
              홈
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
              <h2>소원 조회</h2>
              <div className="admin-list-header-actions">
                <button
                  className="admin-delete-btn"
                  onClick={handleDeleteSelected}
                >
                  소원 삭제
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
                placeholder="소원 이름 또는 고유번호 검색..."
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
                          adminMembersList.filter((r) => r.id !== 1).length >
                            0 &&
                          adminMembersList
                            .filter((r) => r.id !== 1)
                            .every((r) => adminSelectedForDelete.includes(r.id))
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            const newSelections = new Set(
                              adminSelectedForDelete,
                            );
                            adminMembersList.forEach((r) => {
                              if (r.id !== 1) newSelections.add(r.id);
                            });
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
                          {resident.id !== 1 && (
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
                          )}
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
      ) : currentView === "admin-dept-list" ? (
        <div className="admin-list-wrapper">
          <div className="admin-list-container">
            <div className="admin-list-header">
              <h2>부서 조회</h2>
              <div className="admin-list-header-actions">
                <button
                  className="admin-add-btn"
                  onClick={() => setIsDeptAddModalOpen(true)}
                >
                  부서 추가
                </button>
                <button
                  className="admin-delete-btn"
                  onClick={handleDeleteDeptSelected}
                >
                  부서 삭제
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
                placeholder="부서명 또는 부서코드 검색..."
                value={deptSearchValue}
                onChange={(e) => setDeptSearchValue(e.target.value)}
                onFocus={() => {
                  setIsKeyboardOpen(true);
                  setFocusedInput("deptSearch");
                }}
                onClick={() => {
                  setIsKeyboardOpen(true);
                  setFocusedInput("deptSearch");
                }}
                inputMode="none"
              />
              <button
                className="admin-search-btn"
                onClick={() => {
                  setDeptSearchKeyword(deptSearchValue);
                  setDeptCurrentPage(1);
                  setDeptSelectedForDelete([]);
                  setIsKeyboardOpen(false);
                  setFocusedInput(null);
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
                          departmentList.length > 0 &&
                          departmentList.every((d) =>
                            deptSelectedForDelete.includes(d.departmentId),
                          )
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            const newSelections = new Set(
                              deptSelectedForDelete,
                            );
                            departmentList.forEach((d) =>
                              newSelections.add(d.departmentId),
                            );
                            setDeptSelectedForDelete(Array.from(newSelections));
                          } else {
                            const currentIds = departmentList.map(
                              (d) => d.departmentId,
                            );
                            setDeptSelectedForDelete(
                              deptSelectedForDelete.filter(
                                (id) => !currentIds.includes(id),
                              ),
                            );
                          }
                        }}
                      />
                    </th>
                    <th style={{ width: "100px" }}>No.</th>
                    <th>부서코드</th>
                    <th>부서명</th>
                    <th>시작(변경)일자</th>
                  </tr>
                </thead>
                <tbody>
                  {departmentList.length > 0 ? (
                    departmentList.map((dept, idx) => (
                      <tr key={`${dept.departmentId}-${dept.startDate}-${idx}`}>
                        <td
                          style={{ textAlign: "center" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={deptSelectedForDelete.includes(
                              dept.departmentId,
                            )}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setDeptSelectedForDelete([
                                  ...deptSelectedForDelete,
                                  dept.departmentId,
                                ]);
                              } else {
                                setDeptSelectedForDelete(
                                  deptSelectedForDelete.filter(
                                    (id) => id !== dept.departmentId,
                                  ),
                                );
                              }
                            }}
                          />
                        </td>
                        <td>{(deptCurrentPage - 1) * 10 + idx + 1}</td>
                        <td>{dept.deptCd}</td>
                        <td>{dept.deptName}</td>
                        <td>{dept.startDate}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="admin-table-empty">
                        부서 정보가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="admin-pagination">
              {Array.from({ length: deptTotalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    className={`admin-page-btn ${page === deptCurrentPage ? "active" : ""}`}
                    onClick={() => {
                      setDeptCurrentPage(page);
                    }}
                  >
                    {page}
                  </button>
                ),
              )}
            </div>
          </div>
        </div>
      ) : currentView === "admin-member-add" ? (
        <div className="admin-list-wrapper">
          <div className="admin-list-container">
            <div className="admin-list-header">
              <h2>소원 등록</h2>
              <div className="admin-list-header-actions">
                <button
                  className="admin-list-close-btn"
                  onClick={() => setCurrentView("admin")}
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="admin-member-add-form">
              {/* 엑셀 파일 일괄 등록 영역 */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  paddingBottom: "1.5rem",
                  borderBottom: "1px solid #eee",
                  margin: "0.5rem 0 1rem 0",
                }}
              >
                <label
                  htmlFor="member-excel-upload"
                  className="admin-file-upload-btn"
                >
                  📁 엑셀 파일 일괄 등록
                </label>
                <input
                  id="member-excel-upload"
                  type="file"
                  accept=".xlsx, .xls"
                  style={{ display: "none" }}
                  onChange={(e) => setMemberAddExcelFile(e.target.files[0])}
                />
                {memberAddExcelFile && (
                  <span className="admin-file-name">
                    {memberAddExcelFile.name}
                  </span>
                )}
                {memberAddExcelFile && (
                  <button
                    className="admin-history-del-btn"
                    onClick={() => setMemberAddExcelFile(null)}
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="admin-member-add-row">
                <label>이름</label>
                <input
                  type="text"
                  placeholder="예: 홍길동"
                  value={memberAddName}
                  onChange={(e) => setMemberAddName(e.target.value)}
                  onFocus={() => {
                    setIsKeyboardOpen(true);
                    setFocusedInput("memberAddName");
                  }}
                  onClick={() => {
                    setIsKeyboardOpen(true);
                    setFocusedInput("memberAddName");
                  }}
                  inputMode="none"
                />
              </div>
              <div className="admin-member-add-row">
                <label>고유번호</label>
                <input
                  type="text"
                  placeholder="예: M20240001"
                  value={memberAddCode}
                  onChange={(e) => setMemberAddCode(e.target.value)}
                  onFocus={() => {
                    setIsKeyboardOpen(true);
                    setFocusedInput("memberAddCode");
                  }}
                  onClick={() => {
                    setIsKeyboardOpen(true);
                    setFocusedInput("memberAddCode");
                  }}
                  inputMode="none"
                />
              </div>
              <div className="admin-member-add-row">
                <label>입소일자</label>
                <input
                  type="date"
                  value={memberAddJoinDate}
                  onChange={(e) => setMemberAddJoinDate(e.target.value)}
                  onFocus={() => {
                    setIsKeyboardOpen(false);
                    setFocusedInput(null);
                  }}
                  onClick={() => {
                    setIsKeyboardOpen(false);
                    setFocusedInput(null);
                  }}
                />
              </div>
              <div className="admin-member-add-row">
                <label>입소부서</label>
                <input
                  type="text"
                  readOnly
                  placeholder="클릭하여 부서 검색"
                  value={
                    memberAddJoinDept
                      ? `[${memberAddJoinDept.deptCd}] ${memberAddJoinDept.deptName}`
                      : ""
                  }
                  onFocus={() => {
                    setIsKeyboardOpen(false);
                    setFocusedInput(null);
                    setDeptSearchTargetIndex(-1);
                    setDeptSearchKeywordLocal("");
                    setIsDeptSearchModalOpen(true);
                  }}
                  onClick={() => {
                    setIsKeyboardOpen(false);
                    setFocusedInput(null);
                    setDeptSearchTargetIndex(-1);
                    setDeptSearchKeywordLocal("");
                    setIsDeptSearchModalOpen(true);
                  }}
                />
              </div>

              <div
                className="admin-member-add-row"
                style={{ marginTop: "2rem" }}
              >
                <label
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>부서 이동 이력</span>
                  <button
                    className="admin-add-btn"
                    style={{ padding: "0.5rem 1rem", fontSize: "1.2rem" }}
                    onClick={() => {
                      setMemberAddHistories([
                        ...memberAddHistories,
                        { deptCode: "", deptName: "", startDate: "" },
                      ]);
                    }}
                  >
                    + 이력 추가
                  </button>
                </label>
                <div className="admin-member-add-history-list">
                  {memberAddHistories.length === 0 ? (
                    <span style={{ color: "#999", fontSize: "1.3rem" }}>
                      추가된 부서 이동 이력이 없습니다.
                    </span>
                  ) : (
                    memberAddHistories.map((history, idx) => (
                      <div key={idx} className="admin-member-add-history-item">
                        <input
                          type="text"
                          readOnly
                          placeholder="부서 검색"
                          value={
                            history.deptCode
                              ? `[${history.deptCode}] ${history.deptName}`
                              : ""
                          }
                          onClick={() => {
                            setIsKeyboardOpen(false);
                            setFocusedInput(null);
                            setDeptSearchTargetIndex(idx);
                            setDeptSearchKeywordLocal("");
                            setIsDeptSearchModalOpen(true);
                          }}
                        />
                        <input
                          type="date"
                          value={history.startDate}
                          onChange={(e) => {
                            const newArr = [...memberAddHistories];
                            newArr[idx].startDate = e.target.value;
                            setMemberAddHistories(newArr);
                          }}
                          onClick={() => {
                            setIsKeyboardOpen(false);
                            setFocusedInput(null);
                          }}
                        />
                        <button
                          className="admin-history-del-btn"
                          onClick={() => {
                            const newArr = [...memberAddHistories];
                            newArr.splice(idx, 1);
                            setMemberAddHistories(newArr);
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="admin-edit-actions" style={{ marginTop: "2rem" }}>
                <button
                  className="admin-edit-cancel"
                  onClick={() => {
                    setCurrentView("admin");
                    setMemberAddExcelFile(null);
                  }}
                >
                  취소
                </button>
                <button
                  className="admin-edit-save"
                  onClick={handleSaveMemberAdd}
                  disabled={
                    !memberAddExcelFile &&
                    (!memberAddName.trim() ||
                      !memberAddCode.trim() ||
                      !memberAddJoinDate ||
                      !memberAddJoinDept)
                  }
                >
                  소원 등록
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* 관리자 회원 정보 수정 팝업 (모달) */}
      {adminSelectedResident && (
        <div className="admin-edit-modal-overlay">
          <div
            className={`admin-edit-modal ${isKeyboardOpen ? "keyboard-up" : ""}`}
          >
            <h3>소원 정보 수정</h3>
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
                    <label>최초 입사 부서 (참고용)</label>
                    <input
                      type="text"
                      readOnly
                      style={{ backgroundColor: "#f5f5f5" }}
                      value={adminSelectedResident.department || ""}
                    />
                    <label>최초 입사 일자 (참고용)</label>
                    <input
                      type="text"
                      readOnly
                      style={{ backgroundColor: "#f5f5f5" }}
                      value={adminSelectedResident.date || ""}
                    />
                    <label
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span>부서 변경 이력</span>
                      <button
                        className="admin-history-add-btn"
                        style={{ marginTop: 0 }}
                        onClick={() => {
                          setAdminSelectedResident({
                            ...adminSelectedResident,
                            deptHistory: [
                              ...adminSelectedResident.deptHistory,
                              { deptCode: "", deptName: "", startDate: "" },
                            ],
                          });
                        }}
                      >
                        + 이력 추가
                      </button>
                    </label>
                    <ul
                      className="admin-edit-history-list"
                      style={{ gap: "1rem", maxHeight: "180px" }}
                    >
                      {adminSelectedResident.deptHistory &&
                      adminSelectedResident.deptHistory.length > 0 ? (
                        adminSelectedResident.deptHistory.map(
                          (history, idx) => (
                            <li
                              key={idx}
                              className="admin-edit-history-item"
                              style={{
                                display: "flex",
                                gap: "1rem",
                                alignItems: "center",
                              }}
                            >
                              <input
                                type="text"
                                readOnly
                                placeholder="부서 검색"
                                value={
                                  history.deptCode
                                    ? `[${history.deptCode}] ${history.deptName}`
                                    : history.deptName || ""
                                }
                                onClick={() => {
                                  setIsKeyboardOpen(false);
                                  setFocusedInput(null);
                                  setDeptSearchTargetIndex(idx);
                                  setDeptSearchKeywordLocal("");
                                  if (allDepartments.length === 0)
                                    fetchDepartments(); // 부서 목록이 없으면 호출
                                  setIsDeptSearchModalOpen(true);
                                }}
                                style={{
                                  flex: 1,
                                  backgroundColor: "#f5f5f5",
                                  cursor: "pointer",
                                }}
                              />
                              <input
                                type="date"
                                value={history.startDate}
                                onChange={(e) => {
                                  const newHistories = [
                                    ...adminSelectedResident.deptHistory,
                                  ];
                                  newHistories[idx].startDate = e.target.value;
                                  setAdminSelectedResident({
                                    ...adminSelectedResident,
                                    deptHistory: newHistories,
                                  });
                                }}
                                onClick={() => {
                                  setIsKeyboardOpen(false);
                                  setFocusedInput(null);
                                }}
                                style={{ flex: 1 }}
                              />
                              <button
                                className="admin-history-del-btn"
                                title="삭제"
                                onClick={() => {
                                  const newHistories = [
                                    ...adminSelectedResident.deptHistory,
                                  ];
                                  newHistories.splice(idx, 1);
                                  setAdminSelectedResident({
                                    ...adminSelectedResident,
                                    deptHistory: newHistories,
                                  });
                                }}
                              >
                                ✕
                              </button>
                            </li>
                          ),
                        )
                      ) : (
                        <li className="admin-edit-history-item">
                          <span style={{ color: "#999", fontSize: "1.3rem" }}>
                            추가된 부서 이동 이력이 없습니다.
                          </span>
                        </li>
                      )}
                    </ul>
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
                    // 일반 회원 정보 수정 로직 (PUT API 호출)
                    const putPayload = {
                      memberCode: adminSelectedResident.pin || "",
                      name: adminSelectedResident.name || "",
                      profileImagePath:
                        adminSelectedResident.image || "/images/profile.png",
                      histories: adminSelectedResident.deptHistory
                        .filter((h) => h.deptCode && h.startDate) // 빈 값 제외
                        .map((h) => ({
                          deptCode: h.deptCode,
                          deptName: h.deptName,
                          startDate: h.startDate,
                        })),
                    };

                    fetch(`/api/members/${adminSelectedResident.id}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(putPayload),
                    })
                      .then((res) => res.json())
                      .then((json) => {
                        if (json.success) {
                          alert("소원 정보가 성공적으로 수정되었습니다.");
                          setAdminSelectedResident(null);
                          setIsKeyboardOpen(false);
                          setFocusedInput(null);
                          fetchAdminMembers(
                            adminCurrentPage,
                            adminSearchKeyword,
                          ); // 수정 후 목록 새로고침
                        } else {
                          alert(json.message || "정보 수정에 실패했습니다.");
                        }
                      })
                      .catch((err) => {
                        console.error("수정 API 에러:", err);
                        alert("정보 수정 중 오류가 발생했습니다.");
                      });
                  }
                }}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 부서 추가 팝업 (모달) */}
      {isDeptAddModalOpen && (
        <div className="admin-edit-modal-overlay">
          <div
            className={`admin-edit-modal ${isKeyboardOpen ? "keyboard-up" : ""}`}
            style={{ width: "500px" }}
          >
            <h3>부서 추가</h3>
            <div
              className="admin-edit-body"
              style={{ margin: 0, marginBottom: "2rem" }}
            >
              <div className="admin-edit-form" style={{ width: "100%" }}>
                {/* 엑셀 파일 업로드 영역 */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    paddingBottom: "1.5rem",
                    borderBottom: "1px solid #eee",
                    marginBottom: "0.5rem",
                  }}
                >
                  <label
                    htmlFor="dept-excel-upload"
                    className="admin-file-upload-btn"
                  >
                    📁 엑셀 파일 선택
                  </label>
                  <input
                    id="dept-excel-upload"
                    type="file"
                    accept=".xlsx, .xls"
                    style={{ display: "none" }}
                    onChange={(e) => setDeptExcelFile(e.target.files[0])}
                  />
                  {deptExcelFile && (
                    <span className="admin-file-name">
                      {deptExcelFile.name}
                    </span>
                  )}
                  {deptExcelFile && (
                    <button
                      className="admin-history-del-btn"
                      onClick={() => setDeptExcelFile(null)}
                    >
                      ✕
                    </button>
                  )}
                </div>
                <label>부서코드</label>
                <input
                  type="text"
                  placeholder="예: A001"
                  value={newDeptCode}
                  onChange={(e) => setNewDeptCode(e.target.value)}
                  onFocus={() => {
                    setIsKeyboardOpen(true);
                    setFocusedInput("newDeptCode");
                  }}
                  onClick={() => {
                    setIsKeyboardOpen(true);
                    setFocusedInput("newDeptCode");
                  }}
                  inputMode="none"
                />
                <label style={{ marginTop: "1rem" }}>부서명</label>
                <input
                  type="text"
                  placeholder="예: 인사팀"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  onFocus={() => {
                    setIsKeyboardOpen(true);
                    setFocusedInput("newDeptName");
                  }}
                  onClick={() => {
                    setIsKeyboardOpen(true);
                    setFocusedInput("newDeptName");
                  }}
                  inputMode="none"
                />
                <label style={{ marginTop: "1rem" }}>시작(변경)일자</label>
                <input
                  type="date"
                  value={newDeptStartDate}
                  onChange={(e) => setNewDeptStartDate(e.target.value)}
                  onFocus={() => {
                    setIsKeyboardOpen(false); // 날짜 선택 시 가상 키보드 대신 OS 기본 달력 사용
                    setFocusedInput(null);
                  }}
                  onClick={() => {
                    setIsKeyboardOpen(false);
                    setFocusedInput(null);
                  }}
                />
              </div>
            </div>
            <div className="admin-edit-actions">
              <button
                className="admin-edit-cancel"
                onClick={() => {
                  setIsDeptAddModalOpen(false);
                  setNewDeptCode("");
                  setNewDeptName("");
                  setNewDeptStartDate("");
                  setDeptExcelFile(null);
                  setIsKeyboardOpen(false);
                  setFocusedInput(null);
                }}
              >
                취소
              </button>
              <button
                className="admin-edit-save"
                onClick={() => {
                  // 엑셀 파일이 등록된 경우 엑셀 업로드 API 호출
                  if (deptExcelFile) {
                    const formData = new FormData();
                    formData.append("file", deptExcelFile);

                    fetch("/api/departments/excel", {
                      method: "POST",
                      body: formData, // FormData 전송 시 Content-Type은 브라우저가 자동 설정함
                    })
                      .then((res) => res.json())
                      .then((json) => {
                        if (json.success) {
                          alert(
                            "엑셀 파일을 통해 부서가 성공적으로 추가되었습니다.",
                          );
                          setIsDeptAddModalOpen(false);
                          setNewDeptCode("");
                          setNewDeptName("");
                          setNewDeptStartDate("");
                          setDeptExcelFile(null);
                          setIsKeyboardOpen(false);
                          setFocusedInput(null);
                          fetchDepartments(); // 성공 후 부서 목록 갱신
                        } else {
                          alert(json.message || "엑셀 업로드에 실패했습니다.");
                        }
                      })
                      .catch((err) => {
                        console.error("엑셀 업로드 API 에러:", err);
                        alert("엑셀 업로드 중 오류가 발생했습니다.");
                      });
                    return;
                  }

                  // 수동 입력일 경우 빈 값 체크
                  if (
                    !newDeptCode.trim() ||
                    !newDeptName.trim() ||
                    !newDeptStartDate
                  ) {
                    alert(
                      "부서코드, 부서명, 시작(변경)일자를 모두 입력해주세요.",
                    );
                    return;
                  }

                  fetch("/api/departments", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      deptCd: newDeptCode.trim(),
                      deptName: newDeptName.trim(),
                      startDate: newDeptStartDate,
                    }),
                  })
                    .then((res) => res.json())
                    .then((json) => {
                      if (json.success) {
                        alert("부서가 성공적으로 추가되었습니다.");
                        setIsDeptAddModalOpen(false);
                        setNewDeptCode("");
                        setNewDeptName("");
                        setNewDeptStartDate("");
                        setIsKeyboardOpen(false);
                        setFocusedInput(null);
                        fetchDepartments(); // 성공 후 부서 목록 갱신
                      } else {
                        alert(json.message || "부서 추가에 실패했습니다.");
                      }
                    })
                    .catch((err) => {
                      console.error("부서 추가 API 에러:", err);
                      alert("부서 추가 중 오류가 발생했습니다.");
                    });
                }}
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 부서 검색 팝업 (모달) */}
      {isDeptSearchModalOpen && (
        <div
          className="admin-edit-modal-overlay"
          onClick={() => {
            setIsDeptSearchModalOpen(false);
            setIsKeyboardOpen(false);
            setFocusedInput(null);
          }}
        >
          <div
            className={`admin-edit-modal ${isKeyboardOpen ? "keyboard-up" : ""}`}
            style={{ width: "500px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>부서 검색</h3>
            <input
              type="text"
              placeholder="부서명 또는 부서코드 검색..."
              value={deptSearchKeywordLocal}
              onChange={(e) => setDeptSearchKeywordLocal(e.target.value)}
              onFocus={() => {
                setIsKeyboardOpen(true);
                setFocusedInput("deptSearchKeywordLocal");
              }}
              onClick={() => {
                setIsKeyboardOpen(true);
                setFocusedInput("deptSearchKeywordLocal");
              }}
              inputMode="none"
              style={{
                width: "100%",
                padding: "1.2rem",
                fontSize: "1.4rem",
                borderRadius: "8px",
                border: "1px solid #ccc",
                fontFamily: "inherit",
              }}
            />
            <div className="dept-search-modal-list">
              {allDepartments
                .filter(
                  (d) =>
                    d.deptName.includes(deptSearchKeywordLocal) ||
                    d.deptCd.includes(deptSearchKeywordLocal),
                )
                // 부서 이력이 여러 개일 수 있으므로 부서코드(deptCd) 기준으로 1개씩만 중복 제거하여 노출
                .filter(
                  (dept, index, self) =>
                    index === self.findIndex((t) => t.deptCd === dept.deptCd),
                )
                .map((dept, idx) => (
                  <div
                    key={`${dept.departmentId}-${idx}`}
                    className="dept-search-modal-item"
                    onClick={() => {
                      if (currentView === "admin-member-add") {
                        if (deptSearchTargetIndex === -1) {
                          setMemberAddJoinDept(dept);
                        } else {
                          const newArr = [...memberAddHistories];
                          newArr[deptSearchTargetIndex].deptCode = dept.deptCd;
                          newArr[deptSearchTargetIndex].deptName =
                            dept.deptName;
                          setMemberAddHistories(newArr);
                        }
                      } else if (
                        currentView === "admin-list" &&
                        adminSelectedResident
                      ) {
                        // 소원 정보 수정 모달에서 부서를 검색한 경우
                        const newArr = [...adminSelectedResident.deptHistory];
                        newArr[deptSearchTargetIndex].deptCode = dept.deptCd;
                        newArr[deptSearchTargetIndex].deptName = dept.deptName;
                        setAdminSelectedResident({
                          ...adminSelectedResident,
                          deptHistory: newArr,
                        });
                      }
                      setIsDeptSearchModalOpen(false);
                      setDeptSearchKeywordLocal("");
                      setIsKeyboardOpen(false);
                      setFocusedInput(null);
                    }}
                  >
                    [{dept.deptCd}] {dept.deptName}
                  </div>
                ))}
            </div>
            <div className="admin-edit-actions" style={{ marginTop: "1.5rem" }}>
              <button
                className="admin-edit-cancel"
                onClick={() => {
                  setIsDeptSearchModalOpen(false);
                  setIsKeyboardOpen(false);
                  setFocusedInput(null);
                }}
              >
                닫기
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
          <div className={`pin-modal ${isKeyboardOpen ? "keyboard-up" : ""}`}>
            <h2>관리자 로그인</h2>
            <p>관리자 비밀번호를 입력해주세요.</p>
            <input
              type="password"
              className="pin-display"
              placeholder="비밀번호 입력"
              value={adminPinInput}
              onChange={(e) => setAdminPinInput(e.target.value)}
              onFocus={() => {
                setIsKeyboardOpen(true);
                setFocusedInput("adminLogin");
              }}
              onClick={() => {
                setIsKeyboardOpen(true);
                setFocusedInput("adminLogin");
              }}
              inputMode="none" /* 모바일/OS 기본 터치 키보드가 올라오는 것을 방지 */
            />
            <div style={{ display: "flex", gap: "1rem", width: "100%" }}>
              <button
                className="pin-confirm-btn"
                style={{ flex: 1, backgroundColor: "#aaa" }}
                onClick={() => {
                  setShowAdminModal(false);
                  setAdminPinInput("");
                  setIsKeyboardOpen(false);
                  setFocusedInput(null);
                }}
              >
                취소
              </button>
              <button
                className="pin-confirm-btn"
                style={{ flex: 1 }}
                onClick={() => handleAdminPinKey("확인")}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 가상 키보드 영역 (검색, 회원조회, 관리자 로그인 화면에서 공통 사용) */}
      {isKeyboardOpen &&
        (currentView === "search" ||
          currentView === "admin-list" ||
          currentView === "admin-dept-list" ||
          currentView === "admin-member-add" ||
          showAdminModal) && (
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
