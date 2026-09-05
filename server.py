import os
import json
import folder_paths
from aiohttp import web
from server import PromptServer

def get_all_available_models():
    """
    ComfyUI의 folder_paths를 활용하여 각 카테고리별 로컬 보유 모델 목록을 수집합니다.
    """
    model_categories = {
        "checkpoints": "checkpoints",
        "diffusion_models": "diffusion_models",
        "unet": "unet",
        "clip": "clip",
        "text_encoders": "text_encoders",
        "vae": "vae",
        "loras": "loras",
        "controlnet": "controlnet",
        "upscale_models": "upscale_models",
        "clip_vision": "clip_vision",
        "style_models": "style_models",
        "embeddings": "embeddings",
        "gligen": "gligen",
        "photomaker": "photomaker",
    }
    
    result = {}
    
    for key, folder_type in model_categories.items():
        try:
            files = folder_paths.get_filename_list(folder_type)
            result[key] = list(files) if files else []
        except Exception:
            result[key] = []
            
    # diffusion_models와 unet 통합 (ComfyUI 버전에 따라 다를 수 있음)
    if not result.get("diffusion_models") and result.get("unet"):
        result["diffusion_models"] = result["unet"]
    elif not result.get("unet") and result.get("diffusion_models"):
        result["unet"] = result["diffusion_models"]
        
    # clip과 text_encoders 통합
    if not result.get("clip") and result.get("text_encoders"):
        result["clip"] = result["text_encoders"]
    elif not result.get("text_encoders") and result.get("clip"):
        result["text_encoders"] = result["clip"]

    return result

def register_api_routes():
    """
    ComfyUI 웹 프론트엔드와 통신할 REST API 라우트를 등록합니다.
    """
    try:
        routes = PromptServer.instance.routes

        @routes.get("/api/auto-assign/models")
        async def api_get_models(request):
            models_data = get_all_available_models()
            return web.json_response({
                "status": "success",
                "data": models_data
            })
            
    except Exception as e:
        print(f"[AutoModelAssigner] Error registering API routes: {e}")
