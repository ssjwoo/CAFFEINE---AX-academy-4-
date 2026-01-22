# -*- coding: utf-8 -*-
"""
프롬프트 설정 로더

YAML 파일에서 LLM 프롬프트 설정을 로드합니다.
프롬프트를 코드에서 분리하여 운영 편의성을 높입니다.
"""

import os
import yaml
import logging
from pathlib import Path
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# 설정 파일 경로
CONFIG_DIR = Path(__file__).parent
PROMPTS_FILE = CONFIG_DIR / "prompts.yaml"

# 캐시된 설정 (서버 시작 시 1회 로드)
_prompts_cache: Optional[Dict[str, Any]] = None


def load_prompts(force_reload: bool = False) -> Dict[str, Any]:
    """
    프롬프트 설정을 YAML 파일에서 로드합니다.
    
    Args:
        force_reload: True면 캐시를 무시하고 파일에서 다시 로드
        
    Returns:
        프롬프트 설정 딕셔너리
    """
    global _prompts_cache
    
    if _prompts_cache is not None and not force_reload:
        return _prompts_cache
    
    try:
        with open(PROMPTS_FILE, "r", encoding="utf-8") as f:
            _prompts_cache = yaml.safe_load(f)
            logger.info(f"Prompts loaded from {PROMPTS_FILE}")
            return _prompts_cache
    except FileNotFoundError:
        logger.error(f"Prompts file not found: {PROMPTS_FILE}")
        return {}
    except yaml.YAMLError as e:
        logger.error(f"YAML parsing error: {e}")
        return {}


def get_llm_config() -> Dict[str, Any]:
    """LLM 기본 설정 반환"""
    prompts = load_prompts()
    return prompts.get("llm", {
        "model": "gemini-2.0-flash",
        "timeout_grounding": 20.0,
        "timeout_basic": 15.0,
        "grounding_enabled": True
    })


def get_chatbot_prompt(prompt_type: str) -> str:
    """
    챗봇 프롬프트 반환
    
    Args:
        prompt_type: "alarm_persona" 또는 "chatbot_persona"
        
    Returns:
        프롬프트 문자열
    """
    prompts = load_prompts()
    chatbot_prompts = prompts.get("chatbot", {})
    
    if prompt_type not in chatbot_prompts:
        logger.warning(f"Chatbot prompt not found: {prompt_type}")
        return ""
    
    return chatbot_prompts[prompt_type]


def get_report_prompt(prompt_type: str = "strategic_report") -> str:
    """
    리포트 프롬프트 반환
    
    Args:
        prompt_type: 프롬프트 타입 (기본값: "strategic_report")
        
    Returns:
        프롬프트 문자열
    """
    prompts = load_prompts()
    report_prompts = prompts.get("report", {})
    
    if prompt_type not in report_prompts:
        logger.warning(f"Report prompt not found: {prompt_type}")
        return ""
    
    return report_prompts[prompt_type]


def reload_prompts() -> bool:
    """
    프롬프트 설정을 다시 로드합니다.
    런타임 중 프롬프트 변경 시 사용.
    
    Returns:
        성공 여부
    """
    try:
        load_prompts(force_reload=True)
        logger.info("Prompts reloaded successfully")
        return True
    except Exception as e:
        logger.error(f"Failed to reload prompts: {e}")
        return False
