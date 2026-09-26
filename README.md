# Caveduck Chat Downloader

Caveduck 챗봇과의 대화 내역을 간편하게 파일로 백업할 수 있는 [Tampermonkey](https://www.tampermonkey.net/) 유저스크립트입니다.

---

## 🚀 빠른 설치 (Installation)

1. 브라우저에 맞는 **[Tampermonkey 확장 프로그램](https://www.tampermonkey.net/)**을 설치합니다.
2. 확장 프로그램이 활성화된 상태에서 아래 설치 링크를 클릭합니다.
   * 👉 **[스크립트 원클릭 설치 (Install Script)](https://raw.githubusercontent.com/yvelkram/CaveduckDownloader/main/caveduck-downloader.user.js)**
3. Tampermonkey 설치 확인 창이 열리면 **[설치]** 버튼을 누릅니다.

---

## 📖 사용 방법 (How to Use)

1. [Caveduck](https://caveduck.io)에 접속하여 백업할 캐릭터 채팅방으로 이동합니다.
2. **⚠️ 중요:** 채팅방 화면을 **최상단까지 완전히 스크롤**하여 과거 대화 내역을 모두 로드합니다.
   > **주의:** Caveduck은 화면에 표시되지 않은 이전 대화를 지연 로딩(Lazy Loading) 방식으로 불러옵니다. 최상단까지 스크롤하지 않은 채 다운로드를 진행하면 현재 화면에 로드된 최근 대화만 저장됩니다.
3. 화면에 표시되는 **[채팅 다운로드]** 버튼(또는 지정된 트리거 UI)을 클릭합니다.
4. 브라우저 다운로드 폴더에 대화 로그 파일이 저장됩니다.

---

## 📄 저장 형식 (Output Format)

* **파일 형식:** `.txt` / `.json` (실제 구현 포맷 기입)
* **포함 데이터:** 발화자(유저/캐릭터), 메시지 내용, 시간 정보

---

## ⚠️ 유의사항 및 문제 해결 (Troubleshooting)

* **대화가 일부만 저장되는 경우:** 채팅방을 맨 위까지 천천히 올려 모든 대화 풍선이 화면에 렌더링되었는지 확인 후 다시 시도해 주세요.
* **버튼이 보이지 않거나 동작하지 않는 경우:** Caveduck 프론트엔드 UI 업데이트로 인해 파싱 선택자(Selector)가 변경되었을 수 있습니다. [GitHub Issues](https://github.com/yvelkram/CaveduckDownloader/issues)에 오류 상황과 브라우저 콘솔(F12) 로그를 남겨주시면 확인 후 업데이트하겠습니다.

---

## 📜 면책 조항 (Disclaimer)

본 도구는 개인적인 데이터 백업을 위해 제작된 비공식 서드파티 스크립트이며, Caveduck 공식 서비스와는 무관합니다. 다운로드한 대화 내역에 대한 관리 책임은 사용자 본인에게 있습니다.

---

## 📄 기타 (Acknowledgement)

이 소스코드 전체는 AI로 작성되었습니다. (Cluade Opus 5.5 / Medium)
마지막 확인일 : 2026-09-27
