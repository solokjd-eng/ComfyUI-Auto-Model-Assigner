# ⚡ ComfyUI Model & LoRA Auto Assigner
### (스마트 모델 & LoRA 자동 장착 확장 기능)

[![GitHub License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![ComfyUI](https://img.shields.io/badge/ComfyUI-Custom--Node-purple.svg)](https://github.com/comfyanonymous/ComfyUI)
[![Version](https://img.shields.io/badge/version-1.0.0-brightgreen.svg)](https://github.com/solokjd-eng/ComfyUI-Auto-Model-Assigner)

외부에서 다운로드한 ComfyUI 워크플로우를 불러왔을 때 발생하는 **Missing Models (누락된 모델/LoRA/VAE/CLIP 등)** 문제를 **우클릭 한 번으로 1초 만에 감지하고 내 PC의 로컬 모델로 자동 교체/장착**해주는 스마트 확장 기능입니다.

---

## 📸 스크린샷 및 사용 가이드

### 1️⃣ 캔버스 빈 공간 우클릭 ➔ 전체 모델 일괄 자동 장착
> 캔버스 빈 땅을 마우스 우클릭하면 메뉴 최하단에 **`⚡ 전체 모델/LoRA 자동 장착 (Auto-Assign All)`**이 나타납니다.

| 1. 캔버스 빈 곳 우클릭 | 2. 전체 모델 일괄 매칭 팝업창 |
| :---: | :---: |
| ![캔버스 빈 곳 우클릭](docs/images/01_canvas_menu.png) | ![전체 모델 일괄 매칭 모달](docs/images/02_all_models_modal.png) |
| *메뉴 최하단에 자동 장착 메뉴 표시* | *워크플로우 전체의 모델 노드를 스캔하여 한 번에 매칭* |

---

### 2️⃣ 특정 노드 우클릭 ➔ 해당 노드만 단독 자동 장착
> 모델 관련 노드(Load Diffusion Model, Load CLIP, Load VAE 등)를 우클릭하면 메뉴 최하단에 **`⚡ 이 노드 모델 자동 장착 (Auto-Assign)`**이 나타납니다.

| 3. 특정 노드 위에서 우클릭 | 4. 해당 노드 단독 매칭 팝업창 |
| :---: | :---: |
| ![특정 노드 우클릭](docs/images/03_single_node_menu.png) | ![단일 노드 매칭 모달](docs/images/04_single_node_modal.png) |
| *해당 노드 전용 자동 장착 메뉴 표시* | *해당 노드 1개만 단독으로 신속하게 매칭/교체* |

---

## ✨ 핵심 기능

* 🧠 **지능형 스마트 퍼지 매칭 (Smart Fuzzy Matcher)**:
  * **100% 완전 일치**: 파일명은 같으나 하위 폴더 경로가 다른 경우(예: `Z-Image\qwen_3_4b.safetensors`), 확인 창 없이 **즉시 1초 만에 자동 장착**.
  * **유사도 분석**: 정밀도(`fp8`, `bf16`, `fp16`), 버전(`v1`, `v2`), 대소문자, 특수문자를 정규화하여 내 PC에서 가장 적합한 모델을 유사도(%) 순으로 추천.
* 🌐 **원클릭 스마트 온라인 모델 검색 (Google / HuggingFace / Civitai)**:
  * 파일명의 특수문자, 확장자, 경로 등을 분리/정제하여 검색 엔진에 가장 최적화된 키워드로 브라우저 새 탭 검색창을 즉시 띄워줍니다.
  * `[🔍 구글 검색]`, `[🤗 HuggingFace]`, `[💖 Civitai]` 버튼 제공.
* ⏭️ **적용 안함 / 건너뛰기 (Skip) 지원**:
  * 특정 노드의 모델을 바꾸고 싶지 않을 때 원클릭으로 건너뛸 수 있으며, 기존 원본 값이 안전하게 보존됩니다.
* 👁️ **시니어 & 고해상도 맞춤형 대형 UI (Full-Width High-Visibility)**:
  * 크롬 확대를 하지 않아도 화면을 시원하게 꽉 채우는 가로 `92vw` 대형 창과 굵고 큼직한 폰트/버튼 적용.
* 🛡️ **빨간색 에러 테두리 자동 클리어**:
  * 모델 장착 즉시 노드의 빨간 에러 테두리를 말끔하게 제거하고 캔버스/에러 패널을 최신 상태로 새로고침.
* 📌 **우클릭 메뉴 최하단 고정**:
  * 다른 확장 기능이 설치되어 있어도 항상 컨텍스트 메뉴 맨 아래에 일관되게 위치.

---

## 📂 지원 카테고리 및 노드

* **Checkpoints**: `Load Checkpoint`, `CheckpointLoaderSimple` 등 (`ckpt_name`)
* **Diffusion Models / UNET**: `Load Diffusion Model`, `UNETLoader` 등 (`unet_name`)
* **CLIP / Text Encoders**: `Load CLIP`, `CLIPLoader`, `DualCLIPLoader` 등 (`clip_name`)
* **VAE**: `Load VAE`, `VAELoader` 등 (`vae_name`)
* **LoRA**: `LoraLoader`, `LoraLoaderModelOnly` 등 (`lora_name`)
* **ControlNet & Upscale Models**: `ControlNetLoader`, `UpscaleModelLoader` 등

---

## 🚀 설치 방법

### 방법 1. ComfyUI Manager (권장)
* ComfyUI Manager ➔ `Custom Nodes` ➔ **`ComfyUI Auto Model Assigner`** 검색 후 설치.

### 방법 2. Git Clone 수동 설치
ComfyUI의 `custom_nodes` 디렉토리에서 아래 명령어를 실행합니다:

```bash
cd ComfyUI/custom_nodes
git clone https://github.com/solokjd-eng/ComfyUI-Auto-Model-Assigner.git
```

설치 후 ComfyUI를 재시작하고 웹 브라우저를 새로고침(`F5`)하면 즉시 사용하실 수 있습니다.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
