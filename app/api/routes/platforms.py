from fastapi import APIRouter, Depends, Query

from ...core.platforms.platform_handlers import get_platform_info
from ..dependencies import verify_session

router = APIRouter()

# Full platform map mirrored from platform_handlers for listing
_PLATFORMS = [
    {"key": "douyin", "name": "抖音直播"},
    {"key": "tiktok", "name": "TikTok直播"},
    {"key": "kuaishou", "name": "快手直播"},
    {"key": "huya", "name": "虎牙直播"},
    {"key": "douyu", "name": "斗鱼直播"},
    {"key": "yy", "name": "YY直播"},
    {"key": "bilibili", "name": "B站直播"},
    {"key": "xiaohongshu", "name": "小红书直播"},
    {"key": "bigo", "name": "Bigo直播"},
    {"key": "blued", "name": "Blued直播"},
    {"key": "sooplive", "name": "SOOP"},
    {"key": "netease", "name": "网易CC直播"},
    {"key": "pandalive", "name": "PandaTV"},
    {"key": "winktv", "name": "WinkTV"},
    {"key": "flextv", "name": "FlexTV"},
    {"key": "look", "name": "Look直播"},
    {"key": "popkontv", "name": "PopkonTV"},
    {"key": "twitcasting", "name": "TwitCasting"},
    {"key": "baidu", "name": "百度直播"},
    {"key": "weibo", "name": "微博直播"},
    {"key": "kugou", "name": "酷狗直播"},
    {"key": "twitch", "name": "TwitchTV"},
    {"key": "liveme", "name": "LiveMe"},
    {"key": "huajiao", "name": "花椒直播"},
    {"key": "showroom", "name": "ShowRoom"},
    {"key": "acfun", "name": "Acfun"},
    {"key": "inke", "name": "映客直播"},
    {"key": "zhihu", "name": "知乎直播"},
    {"key": "chzzk", "name": "CHZZK"},
    {"key": "17live", "name": "17Live"},
    {"key": "youtube", "name": "Youtube"},
    {"key": "taobao", "name": "淘宝直播"},
    {"key": "twitch", "name": "TwitchTV"},
    {"key": "picarto", "name": "Picarto"},
    {"key": "custom", "name": "自定义录制直播"},
]


@router.get("")
async def list_platforms(_: dict = Depends(verify_session)):
    return _PLATFORMS


@router.get("/detect")
async def detect_platform(
    url: str = Query(...),
    _: dict = Depends(verify_session),
):
    platform, platform_key = get_platform_info(url)
    return {"platform": platform, "platform_key": platform_key, "detected": platform is not None}
