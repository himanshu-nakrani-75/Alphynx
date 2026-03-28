import unittest
from unittest.mock import MagicMock, patch
import sys
import os

# Define a mock HTTPException BEFORE any imports
class MockHTTPException(Exception):
    def __init__(self, status_code, detail=None, headers=None):
        self.status_code = status_code
        self.detail = detail
        self.headers = headers

# Create a mock pydantic BaseModel
class MockBaseModel:
    pass

# Setup mocks for all dependencies
mocks = [
    'fastapi',
    'fastapi.security',
    'fastapi.middleware.cors',
    'sqlalchemy',
    'sqlalchemy.orm',
    'sqlalchemy.ext.declarative',
    'sqlalchemy.schema',
    'pydantic',
    'jose',
    'jose.jwt',
    'passlib',
    'passlib.context',
    'bcrypt',
    'python-multipart'
]

for mock_name in mocks:
    m = MagicMock()
    sys.modules[mock_name] = m

# Specific fixes for things used in imports/base classes
import fastapi
import pydantic
fastapi.HTTPException = MockHTTPException

class MockBaseModel:
    pass
pydantic.BaseModel = MockBaseModel

# We also need to mock app.core.database before anything else
sys.modules['app.core.database'] = MagicMock()
sys.modules['app.core.schemas'] = MagicMock()
sys.modules['app.models.portfolio'] = MagicMock()
sys.modules['app.models.user'] = MagicMock()
sys.modules['app.routers.auth'] = MagicMock()

# Set PYTHONPATH
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

# Patch the decorator to do nothing
def mock_decorator(*args, **kwargs):
    def wrapper(f):
        return f
    return wrapper

# Use patch to mock APIRouter BEFORE importing
with patch('fastapi.APIRouter') as mock_router:
    mock_router.return_value.get = mock_decorator
    mock_router.return_value.post = mock_decorator
    mock_router.return_value.delete = mock_decorator

    from app.routers.portfolio import delete_portfolio_item

class TestDeletePortfolioItem(unittest.TestCase):
    def setUp(self):
        self.db = MagicMock()
        self.current_user = MagicMock()
        self.current_user.id = 1
        self.item_id = 1

    def test_delete_portfolio_item_success(self):
        # Mock the portfolio item
        mock_item = MagicMock()
        mock_item.id = self.item_id
        mock_item.owner_id = self.current_user.id

        # Configure the mock query
        self.db.query.return_value.filter.return_value.first.return_value = mock_item

        # Call the function
        result = delete_portfolio_item(
            item_id=self.item_id,
            current_user=self.current_user,
            db=self.db
        )

        # Assertions
        self.assertEqual(result, mock_item)
        self.db.delete.assert_called_once_with(mock_item)
        self.db.commit.assert_called_once()

    def test_delete_portfolio_item_not_found(self):
        # Configure the mock query to return None
        self.db.query.return_value.filter.return_value.first.return_value = None

        # Call the function and expect HTTPException
        with self.assertRaises(MockHTTPException) as cm:
            delete_portfolio_item(
                item_id=self.item_id,
                current_user=self.current_user,
                db=self.db
            )

        # Assertions
        self.assertEqual(cm.exception.status_code, 404)
        self.assertEqual(cm.exception.detail, "Portfolio item not found")
        self.db.delete.assert_not_called()
        self.db.commit.assert_not_called()

    def test_delete_portfolio_item_wrong_owner(self):
        # Configure the mock query to return None (simulating not finding it for THIS user)
        self.db.query.return_value.filter.return_value.first.return_value = None

        with self.assertRaises(MockHTTPException) as cm:
            delete_portfolio_item(
                item_id=self.item_id,
                current_user=self.current_user,
                db=self.db
            )

        self.assertEqual(cm.exception.status_code, 404)
        self.db.delete.assert_not_called()

if __name__ == "__main__":
    unittest.main()
