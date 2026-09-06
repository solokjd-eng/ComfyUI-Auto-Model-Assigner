# ⚡ ComfyUI Model & LoRA Auto Assigner
> **Auto-detect & link missing models, UNETs, CLIPs, VAEs, and LoRAs to your local files with 1-Click Smart Matching.**  
> *(외부 워크플로우 로드 시 누락된 모델을 원클릭으로 감지하고 내 PC 모델로 자동 연결해주는 스마트 확장 노드)*

[![GitHub License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![ComfyUI](https://img.shields.io/badge/ComfyUI-Custom--Node-purple.svg)](https://github.com/comfyanonymous/ComfyUI)
[![Version](https://img.shields.io/badge/version-1.1.0-brightgreen.svg)](https://github.com/solokjd-eng/ComfyUI-Auto-Model-Assigner)

---

## 📺 작동 화면 및 사용 방법 (How It Works)

외부에서 다운로드한 워크플로우를 불러왔을 때 파일명이나 하위 경로가 달라 모델이 누락되어도 걱정 없습니다. **두 가지 직관적인 우클릭 방식**으로 손쉽게 해결할 수 있습니다:

---

### Case 1️⃣ 캔버스 빈 곳 우클릭 ➔ 전체 모델 일괄 자동 장착 (Auto-Assign All)

다른 사람이 제작한 워크플로우를 열었을 때, **캔버스 빈 공간을 마우스 우클릭**하여 워크플로우 전체의 모든 모델을 한 번에 스캔하고 연결합니다.

| 1. 캔버스 빈 공간 마우스 우클릭 | 2. 전체 모델 일괄 스마트 매칭 창 |
| :---: | :---: |
| ![캔버스 빈 곳 우클릭](docs/images/01_canvas_menu.png) | ![전체 모델 일괄 매칭 모달](docs/images/02_all_models_modal_v2.png) |
| *메뉴 최하단 `⚡ 전체 모델/LoRA 자동 장착` 클릭* | *모든 누락 노드를 감지하여 100% 매칭 및 유사도 순 추천 제공* |

* **100% 일치 파일**: 파일명은 같으나 하위 경로가 다른 경우(예: `Z-Image\qwen_3_4b.safetensors`, `flux\ae.safetensors`), 즉시 초록색 `100%`로 자동 선택됩니다.
* **스마트 온라인 검색**: `🔍 구글 검색`, `🤗 HuggingFace`, `💖 Civitai` 버튼을 눌러 원본 모델을 1초 만에 웹에서 찾아 다운로드할 수 있습니다.
* **건너뛰기 지원**: 변경하고 싶지 않은 노드는 `⏭️ 적용 안함 (건너뛰기)`를 눌러 기존 값을 안전하게 보존할 수 있습니다.

---

### Case 2️⃣ 특정 노드 우클릭 ➔ 해당 노드만 단독 자동 장착 (Auto-Assign This Node)

전체 워크플로우가 아니라 **특정 노드 1개만** 신속하게 모델을 확인하고 교체하고 싶을 때 사용합니다.

| 3. 특정 노드 위에서 마우스 우클릭 | 4. 해당 노드 단독 스마트 매칭 창 |
| :---: | :---: |
| ![특정 노드 우클릭](docs/images/03_single_node_menu.png) | ![단일 노드 매칭 모달](docs/images/04_single_node_modal_v2.png) |
| *메뉴 최하단 `⚡ 이 노드 모델 자동 장착` 클릭* | *선택한 노드 1개만 단독으로 신속하게 매칭/교체* |

---

## ✨ 주요 특징 (Key Features)

1. 🌲 **윈도우 탐색기 스타일 대형 폴더 트리 (Folder Tree Explorer)**
   - 각 모델 폴더의 하위 계층 구조를 윈도우 탐색기처럼 펼치고 접으며 시원하게 탐색할 수 있습니다.
   - 모달을 열면 현재 선택/장착된 모델 파일이 있는 폴더가 자동으로 펼쳐지고 파일이 화면 중앙에 즉시 하이라이트됩니다.
2. 🧩 **서드파티 멀티 모델 / LoRA 노드 완벽 지원 (Universal Slot Adapter)**
   - `Power Lora Loader (rgthree)`, `DaSiWa LoRA Loader (JSON Stack)`, `Deno Multi LoRA Loader`, `Comfyroll`, `Efficiency Nodes` 등 객체형/배열형 멀티 모델 노드도 슬롯별로 개별 분리 감지하여 완벽하게 장착합니다.
3. 🧠 **지능형 퍼지 매칭 엔진 (Smart Fuzzy Matcher)**
   - 대소문자, 정밀도(`fp8`, `bf16`, `fp16`), 버전(`v1`, `v2`, `turbo`), 언더바/하이픈을 정규화하여 내 PC에서 가장 적합한 모델을 유사도(%) 순으로 정렬하여 추천합니다.
4. 🌐 **AI 모델 전용 원클릭 스마트 검색 (Google / HuggingFace / Civitai)**
   - 파일명의 군더더기(확장자, 특수문자, 폴더명)를 깔끔하게 분리·정제하여 검색창을 열어주므로 구글/허깅페이스/Civitai에서 100% 정확한 다운로드 페이지가 뜹니다.
5. 👁️ **시니어 & 대화면 맞춤형 대형 가시성 UI (Full-Width High Visibility)**
   - 브라우저를 억지로 확대할 필요 없이 화면을 시원하게 꽉 채우는 가로 `94vw` 대형 팝업과 최대 480px 높이의 대형 폴더 트리를 제공합니다.
6. 🛡️ **빨간색 에러 테두리 자동 제거 & 언제든 재확인 가능**
   - 모델을 장착하는 즉시 노드 주변의 빨간 에러 테두리를 말끔히 지우고 캔버스를 정상 상태로 리프레시하며, 이미 장착된 모델도 언제든 다시 열어 모델을 교체할 수 있습니다.
7. 📌 **우클릭 메뉴 최하단 고정**
   - 다른 확장 프로그램이 많이 설치되어 있어도 항상 컨텍스트 메뉴의 가장 맨 아래에 깔끔하게 고정됩니다.

---

## 📂 지원하는 모델 및 노드 종류 (Supported Model Types)

워크플로우 로드 시 모델 파일이 누락되어 위젯이 비어있거나 빨간 테두리 에러가 발생하는 모든 주요 모델 및 서드파티 노드를 폭넓게 지원합니다.

| 카테고리 | 지원 대상 및 대표 노드 예시 | 주요 파일 확장자 |
| :--- | :--- | :--- |
| **체크포인트 (Checkpoints)** | `Load Checkpoint`, `CheckpointLoaderSimple` 등 (SD 1.5, SDXL, Flux, SD3, Illustrious 등) | `.safetensors`, `.ckpt` |
| **디퓨전/UNET 모델** | `UNETLoader`, `Load Diffusion Model` (Flux UNET, Wan 2.1, Hunyuan, CogVideo 등) | `.safetensors`, `.pt` |
| **LoRA (로라)** | `LoraLoader`, `LoraLoaderModelOnly`, 각종 다중 LoRA 노드 (LyCORIS, LoCon 포함) | `.safetensors` |
| **업스케일 모델 (Upscale)** | `UpscaleModelLoader`, `Load Upscale Model` (4x-UltraSharp, NMKD, DAT, RealESRGAN 등) | `.pth`, `.pt`, `.safetensors` |
| **VAE** | `VAELoader`, `Load VAE` (sdxl_vae, vae-ft-mse 등) | `.safetensors`, `.pt` |
| **CLIP / 텍스트 인코더** | `CLIPLoader`, `DualCLIPLoader`, `TripleCLIPLoader`, `Load CLIP` (t5xxl, clip-l, clip-g 등) | `.safetensors`, `.bin` |
| **ControlNet** | `ControlNetLoader`, `DiffControlNetLoader` | `.safetensors`, `.pth` |
| **기타 특수 모델** | `Clip Vision` (IP-Adapter용), `Style Models`, `PhotoMaker`, `GLIGEN`, `Embeddings` 등 | `.safetensors`, `.bin`, `.pt` |

> 💡 **서드파티 커스텀 노드 99% 호환**: 기본 노드뿐만 아니라 드롭다운 콤보 위젯 내 모델 파일 확장자(`.safetensors`, `.ckpt`, `.pt`, `.bin`, `.pth`)를 자동 감지하므로 다양한 커스텀 노드 팩의 모델 로더도 문제없이 지원합니다.

---

### ⚠️ 에러 유형 안내 (Missing Model vs Missing Node)

* ⭕ **[본 확장 노드로 완벽 해결] 모델 파일 누락 (Missing Models)**
  - 노드는 화면에 표시되지만 모델 선택 칸이 비어있거나 빨간 테두리가 둘러진 경우
  - 👉 빈 공간 우클릭 `⚡ 전체 모델/LoRA 자동 장착`으로 1초 만에 내 PC의 파일로 연결하거나 원클릭 다운로드 링크로 해결할 수 있습니다.
* ❌ **[ComfyUI Manager 필요] 노드 패키지 미설치 (Missing Custom Nodes)**
  - 노드 자체가 화면에서 회색/빨간 빗금으로 변하고 `UNKNOWN (Missing Node)`로 뜨는 경우
  - 👉 노드 프로그램 자체가 설치되지 않은 것이므로, **ComfyUI Manager ➔ Install Missing Custom Nodes**를 통해 노드를 먼저 설치한 후 사용해 주세요.

---

## 🚀 설치 방법 (Installation)

### Method 1. Git Clone (권장)
ComfyUI의 `custom_nodes` 디렉토리에서 터미널을 열고 아래 명령어를 실행합니다:

```bash
cd ComfyUI/custom_nodes
git clone https://github.com/solokjd-eng/ComfyUI-Auto-Model-Assigner.git
```

### Method 2. ComfyUI Manager
1. ComfyUI 우측 메뉴에서 **Manager**를 엽니다.
2. **Custom Nodes Manager**에서 `ComfyUI Auto Model Assigner`를 검색한 후 **Install**을 누릅니다.

> 설치 후 ComfyUI를 재시작하고 브라우저를 새로고침(`F5`)하면 바로 사용하실 수 있습니다!

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
