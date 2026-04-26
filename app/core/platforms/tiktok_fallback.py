import json
import re
from http.cookies import SimpleCookie

from curl_cffi import CurlOpt, CurlSslVersion, Session
from streamget import StreamData


def _cookie_string_to_dict(cookies: str | None) -> dict[str, str]:
    if not cookies:
        return {}
    parsed = SimpleCookie()
    parsed.load(cookies)
    return {key: morsel.value for key, morsel in parsed.items()}


class TikTokFallbackClient:
    BASE_URL = "https://www.tiktok.com"
    WEBCAST_URL = "https://webcast.tiktok.com"
    TIKREC_API = "https://tikrec.com"

    def __init__(self, proxy: str | None = None, cookies: str | None = None):
        self.session = Session(
            impersonate="chrome136",
            http_version="v1",
            curl_options={CurlOpt.SSLVERSION: CurlSslVersion.TLSv1_2},
        )
        self.session.headers.update(
            {
                "Sec-Ch-Ua": '"Not/A)Brand";v="8", "Chromium";v="126"',
                "Sec-Ch-Ua-Mobile": "?0",
                "Sec-Ch-Ua-Platform": '"Windows"',
                "Accept-Language": "en-US",
                "Upgrade-Insecure-Requests": "1",
                "User-Agent": (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                    "(KHTML, like Gecko) Chrome/126.0.6478.127 Safari/537.36"
                ),
                "Accept": (
                    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,"
                    "image/apng,application/json,text/plain,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7"
                ),
                "Sec-Fetch-Site": "none",
                "Sec-Fetch-Mode": "navigate",
                "Sec-Fetch-User": "?1",
                "Sec-Fetch-Dest": "document",
                "Priority": "u=0, i",
                "Referer": "https://www.tiktok.com/",
                "Origin": "https://www.tiktok.com",
            }
        )
        self.session.cookies.update(_cookie_string_to_dict(cookies))
        if proxy:
            self.session.proxies.update({"http": proxy, "https": proxy})

    def _get_username(self, live_url: str) -> str:
        match = re.search(r"tiktok\.com/@([^/?#]+)", live_url)
        if not match:
            raise ValueError("Invalid TikTok URL")
        return match.group(1)

    def _get_room_id(self, username: str) -> str:
        sign_response = self.session.get(
            f"{self.TIKREC_API}/tiktok/room/api/sign",
            params={"unique_id": username},
            timeout=20,
        )
        sign_response.raise_for_status()
        signed_path = sign_response.json().get("signed_path")
        if not signed_path:
            raise ValueError("TikRec did not return a signed path")

        room_response = self.session.get(f"{self.BASE_URL}{signed_path}", timeout=20)
        room_response.raise_for_status()
        if not room_response.text or "Please wait" in room_response.text or "SlardarWAF" in room_response.text:
            raise ConnectionError("TikTok WAF blocked signed room lookup")

        room_id = (room_response.json().get("data") or {}).get("user", {}).get("roomId")
        if not room_id:
            raise ValueError("TikTok room id not found")
        return room_id

    def _get_room_info(self, room_id: str) -> dict:
        response = self.session.get(
            f"{self.WEBCAST_URL}/webcast/room/info/",
            params={"aid": "1988", "room_id": room_id},
            timeout=20,
        )
        response.raise_for_status()
        return response.json()

    def _is_room_alive(self, room_id: str) -> bool:
        response = self.session.get(
            f"{self.WEBCAST_URL}/webcast/room/check_alive/",
            params={"aid": "1988", "region": "CH", "room_ids": room_id, "user_is_login": "true"},
            timeout=20,
        )
        response.raise_for_status()
        data = response.json().get("data") or []
        return bool(data and data[0].get("alive"))

    def _get_best_flv(self, room_info: dict) -> str | None:
        stream_url = (room_info.get("data") or {}).get("stream_url") or {}
        sdk_data_str = (
            stream_url.get("live_core_sdk_data", {})
            .get("pull_data", {})
            .get("stream_data")
        )
        if not sdk_data_str:
            flv_pull_url = stream_url.get("flv_pull_url") or {}
            return (
                flv_pull_url.get("FULL_HD1")
                or flv_pull_url.get("HD1")
                or flv_pull_url.get("SD2")
                or flv_pull_url.get("SD1")
                or stream_url.get("rtmp_pull_url")
            )

        sdk_data = json.loads(sdk_data_str).get("data") or {}
        qualities = (
            stream_url.get("live_core_sdk_data", {})
            .get("pull_data", {})
            .get("options", {})
            .get("qualities", [])
        )
        level_map = {quality["sdk_key"]: quality["level"] for quality in qualities if "sdk_key" in quality}
        best_level = -1
        best_flv = None
        for sdk_key, entry in sdk_data.items():
            level = level_map.get(sdk_key, -1)
            flv_url = (entry.get("main") or {}).get("flv")
            if flv_url and level > best_level:
                best_level = level
                best_flv = flv_url
        return best_flv

    def get_stream_info(self, live_url: str, quality: str | None = None) -> StreamData:
        username = self._get_username(live_url)
        room_id = self._get_room_id(username)
        is_live = self._is_room_alive(room_id)
        room_info = self._get_room_info(room_id)
        data = room_info.get("data") or {}
        owner = data.get("owner") or {}
        flv_url = self._get_best_flv(room_info)

        return StreamData(
            platform="TikTok直播",
            anchor_name=owner.get("display_id") or username,
            is_live=is_live,
            title=data.get("title") or "",
            quality=quality,
            flv_url=flv_url,
            record_url=flv_url,
            live_url=live_url,
            extra={"room_id": room_id},
        )
