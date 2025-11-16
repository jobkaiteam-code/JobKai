"""
Firebase Authentication Middleware for FastAPI
Verifies Firebase ID tokens and attaches user info to requests
"""

from fastapi import Request, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin
from firebase_admin import credentials, auth
import os
import logging
from typing import Optional, Dict

logger = logging.getLogger(__name__)

# Initialize Firebase Admin SDK
def initialize_firebase():
    """Initialize Firebase Admin SDK with service account"""
    try:
        # Check if already initialized
        firebase_admin.get_app()
        logger.info("Firebase Admin SDK already initialized")
    except ValueError:
        # Initialize with service account
        service_account_path = os.getenv(
            "FIREBASE_SERVICE_ACCOUNT",
            "/app/job-kai-firebase-adminsdk-fbsvc-9244ba7dc4.json"
        )
        
        if not os.path.exists(service_account_path):
            logger.error(f"Firebase service account file not found: {service_account_path}")
            raise FileNotFoundError(f"Firebase service account file not found: {service_account_path}")
        
        cred = credentials.Certificate(service_account_path)
        firebase_admin.initialize_app(cred)
        logger.info(f"Firebase Admin SDK initialized with service account: {service_account_path}")

# Initialize Firebase on module load
try:
    initialize_firebase()
except Exception as e:
    logger.error(f"Failed to initialize Firebase: {e}")


# Security scheme for Bearer token
security = HTTPBearer(auto_error=False)


async def verify_firebase_token(credentials: HTTPAuthorizationCredentials) -> Dict:
    """
    Verify Firebase ID token and return decoded user info
    
    Args:
        credentials: HTTP Authorization credentials (Bearer token)
        
    Returns:
        dict: Decoded token with user information
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No authentication token provided",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    
    try:
        # Verify the ID token
        decoded_token = auth.verify_id_token(token)
        
        logger.info(f"Token verified for user: {decoded_token.get('email', decoded_token.get('uid'))}")
        
        return decoded_token
        
    except auth.ExpiredIdTokenError:
        logger.warning(f"Expired token attempted")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired. Please login again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except auth.RevokedIdTokenError:
        logger.warning(f"Revoked token attempted")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked. Please login again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except auth.InvalidIdTokenError:
        logger.warning(f"Invalid token attempted")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.error(f"Token verification failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[Dict]:
    """
    Optional authentication - returns user if token is valid, None otherwise
    Use this for endpoints that work with or without authentication
    
    Args:
        credentials: HTTP Authorization credentials (Bearer token)
        
    Returns:
        dict or None: User information if authenticated, None otherwise
    """
    if not credentials:
        return None
    
    try:
        return await verify_firebase_token(credentials)
    except HTTPException:
        return None


async def require_auth(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict:
    """
    Required authentication dependency
    Use this for protected endpoints that require authentication
    
    Args:
        credentials: HTTP Authorization credentials (Bearer token)
        
    Returns:
        dict: User information from decoded token
        
    Raises:
        HTTPException: If authentication fails
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return await verify_firebase_token(credentials)


async def require_role(required_role: str):
    """
    Role-based access control decorator
    Checks if user has the required role (stored in custom claims)
    
    Args:
        required_role: Required role (e.g., "admin", "pro", "enterprise")
        
    Returns:
        Function: Dependency function that checks role
    """
    async def check_role(user: Dict = require_auth) -> Dict:
        """Check if user has required role"""
        user_role = user.get("role", "free")  # Default to free tier
        
        # Role hierarchy
        role_hierarchy = {
            "free": 0,
            "pro": 1,
            "enterprise": 2,
            "admin": 3
        }
        
        user_level = role_hierarchy.get(user_role, 0)
        required_level = role_hierarchy.get(required_role, 0)
        
        if user_level < required_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Requires {required_role} subscription."
            )
        
        return user
    
    return check_role


class AuthMiddleware:
    """
    ASGI Middleware to attach user info to request state if authenticated
    This allows optional authentication across all routes
    """
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        """Process request and attach user info if authenticated (ASGI interface)"""
        
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        # Extract token from Authorization header
        headers = dict(scope.get("headers", []))
        auth_header = headers.get(b"authorization", b"").decode("utf-8")
        
        # Create a proper state dict that Starlette will use
        if "state" not in scope:
            scope["state"] = {}
        
        state = scope["state"]
        
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            
            try:
                # Verify token
                decoded_token = auth.verify_id_token(token)
                
                # Attach user info to state
                state["user"] = decoded_token
                state["authenticated"] = True
                
                logger.info(f"Token verified for user: {decoded_token.get('email')}")
                
            except Exception as e:
                # Don't block request, just log the error
                logger.warning(f"Token verification failed in middleware: {str(e)}")
                state["user"] = None
                state["authenticated"] = False
        else:
            state["user"] = None
            state["authenticated"] = False
        
        # Continue processing request
        await self.app(scope, receive, send)


def get_user_from_request(request: Request) -> Optional[Dict]:
    """
    Helper function to get user from request state
    Use this in route handlers to access authenticated user
    
    Args:
        request: FastAPI Request object
        
    Returns:
        dict or None: User information if authenticated
    """
    return getattr(request.state, "user", None)


def is_authenticated(request: Request) -> bool:
    """
    Check if request is authenticated
    
    Args:
        request: FastAPI Request object
        
    Returns:
        bool: True if authenticated, False otherwise
    """
    return getattr(request.state, "authenticated", False)
