from fastapi import APIRouter, Depends, HTTPException

from ..dependencies import get_auth_manager, verify_session
from ..schemas.auth import ChangePasswordInput, LoginInput, LoginResponse, SessionResponse

router = APIRouter()


@router.post("/login", response_model=LoginResponse)
async def login(body: LoginInput, auth=Depends(get_auth_manager)):
    success, token = await auth.authenticate(body.username, body.password)
    if not success or not token:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    session = auth.active_sessions[token]
    return LoginResponse(
        token=token,
        username=session["username"],
        is_admin=session["is_admin"],
    )


@router.post("/logout")
async def logout(session: dict = Depends(verify_session), auth=Depends(get_auth_manager)):
    token = next(
        (t for t, s in auth.active_sessions.items() if s is session),
        None,
    )
    if token:
        auth.logout(token)
    return {"success": True}


@router.get("/session", response_model=SessionResponse)
async def check_session(session: dict = Depends(verify_session)):
    return SessionResponse(
        valid=True,
        username=session.get("username"),
        is_admin=session.get("is_admin"),
    )


@router.put("/password")
async def change_password(
    body: ChangePasswordInput,
    session: dict = Depends(verify_session),
    auth=Depends(get_auth_manager),
):
    username = session.get("username")
    success = await auth.change_password(username, body.old_password, body.new_password)
    if not success:
        raise HTTPException(status_code=400, detail="Old password incorrect")
    return {"success": True}
