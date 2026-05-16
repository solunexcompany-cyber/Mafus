from fastapi import APIRouter
from app.api.endpoints import auth, users, assets, assignments, payments, clients

api_router = APIRouter()
api_router.include_router(auth.router, tags=["login"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(assets.router, prefix="/assets", tags=["assets"])
api_router.include_router(assignments.router, prefix="/assignments", tags=["assignments"])
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
api_router.include_router(clients.router, prefix="/clients", tags=["clients"])
