"""
ComfyUI Auto Model & LoRA Assigner
워크플로우 로드 시 로컬 모델 및 LoRA를 자동으로 감지하고 스마트하게 매칭/장착해주는 커스텀 노드 및 웹 익스텐션
"""

import os
from .server import register_api_routes

# 웹 프론트엔드 정적 파일 디렉토리 설정 (ComfyUI가 자동으로 JS/CSS를 로드함)
WEB_DIRECTORY = "./web"

# 노드 클래스 매핑 (UI 익스텐션 중심 노드로 기본 노드 매핑은 비워둠)
NODE_CLASS_MAPPINGS = {}
NODE_DISPLAY_NAME_MAPPINGS = {}

# 백엔드 API 라우트 등록
register_api_routes()

print("[ComfyUI-Auto-Model-Assigner] Extension loaded successfully! ⚡")
