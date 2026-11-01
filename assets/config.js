/* ============================================================
   아키네이터의 비밀 – 웹 활동지 설정 파일
   선생님이 바꿔야 하는 곳은 이 파일 하나뿐입니다.
   ============================================================ */
window.AKN_CONFIG = {
  // ① 구글 Apps Script 웹앱 주소 (README의 2단계에서 복사한 주소)
  //    비워 두면 '체험 모드'로 동작합니다. (이 기기에만 저장)
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbz13A4SxqSYTuI1-QuC4si6pcci-9zB5aNRxjGBQrVxok_v_eeA8mXrD37SvWYk_87tKg/exec",

  // ② 학교·과목 표시
  SCHOOL: "웅상중학교",
  SUBJECT: "정보 · 알고리즘과 프로그래밍",

  // ③ 학급과 모둠 수 (로그인 화면의 선택지)
  CLASSES: ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
  GROUPS: 5,
  MAX_NUMBER: 6,   // 모둠 안 번호 최대값

  // ④ 체험 모드에서만 쓰는 교사 비밀번호
  //    (구글 시트 연결 후에는 Apps Script의 TEACHER_KEY가 쓰입니다)
  DEMO_TEACHER_KEY: "1234"
};
