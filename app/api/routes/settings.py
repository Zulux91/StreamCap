from typing import Any

from fastapi import APIRouter, Depends

from ..dependencies import get_recording_manager, get_settings, verify_session

router = APIRouter()


@router.get("")
async def get_settings_endpoint(
    settings=Depends(get_settings),
    _: dict = Depends(verify_session),
):
    return settings.user_config


@router.put("")
async def update_settings_endpoint(
    body: dict[str, Any],
    settings=Depends(get_settings),
    rm=Depends(get_recording_manager),
    _: dict = Depends(verify_session),
):
    settings.user_config.update(body)
    await rm.app.config_manager.save_user_config(settings.user_config)
    return settings.user_config


@router.get("/defaults")
async def get_defaults(
    settings=Depends(get_settings),
    _: dict = Depends(verify_session),
):
    return settings.default_config


@router.get("/languages")
async def get_languages(
    rm=Depends(get_recording_manager),
    _: dict = Depends(verify_session),
):
    lang_config = rm.app.config_manager.load_language_config()
    return list(lang_config.keys()) if lang_config else []


@router.get("/cookies")
async def get_cookies(
    settings=Depends(get_settings),
    _: dict = Depends(verify_session),
):
    return settings.cookies_config


@router.put("/cookies")
async def update_cookies(
    body: dict[str, Any],
    settings=Depends(get_settings),
    rm=Depends(get_recording_manager),
    _: dict = Depends(verify_session),
):
    settings.cookies_config.update(body)
    await rm.app.config_manager.save_cookies_config(settings.cookies_config)
    return settings.cookies_config


@router.get("/accounts")
async def get_accounts(
    settings=Depends(get_settings),
    _: dict = Depends(verify_session),
):
    return settings.accounts_config


@router.put("/accounts")
async def update_accounts(
    body: dict[str, Any],
    settings=Depends(get_settings),
    rm=Depends(get_recording_manager),
    _: dict = Depends(verify_session),
):
    settings.accounts_config.update(body)
    await rm.app.config_manager.save_accounts_config(settings.accounts_config)
    return settings.accounts_config
