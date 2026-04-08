import unittest
from unittest.mock import MagicMock, patch
from datetime import timedelta
import sys
import os

# Define mock modules for dependencies not available in the environment
# This matches the pattern in test_portfolio_delete.py
mocks = [
    'passlib',
    'passlib.context',
    'jose',
    'jose.jwt'
]

for mock_name in mocks:
    sys.modules[mock_name] = MagicMock()

# Set PYTHONPATH to include the backend directory
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

# Import security module after mocking its dependencies
from app.core.security import get_password_hash, verify_password, create_access_token, pwd_context, SECRET_KEY, ALGORITHM
from jose import jwt

class TestSecurity(unittest.TestCase):
    """
    Tests for security utility functions.
    Mocks external libraries (passlib, jose) because they are not available in the environment.
    """

    def test_get_password_hash(self):
        """
        Verify that get_password_hash calls pwd_context.hash with the correct password.
        """
        password = "testpassword"
        hashed_password = "hashed_testpassword"
        pwd_context.hash.reset_mock()
        pwd_context.hash.return_value = hashed_password

        result = get_password_hash(password)

        self.assertEqual(result, hashed_password)
        pwd_context.hash.assert_called_once_with(password)

    def test_verify_password_match(self):
        """
        Verify that verify_password returns True when pwd_context.verify returns True.
        """
        password = "testpassword"
        hashed_password = "hashed_testpassword"
        pwd_context.verify.reset_mock()
        pwd_context.verify.return_value = True

        result = verify_password(password, hashed_password)

        self.assertTrue(result)
        pwd_context.verify.assert_called_once_with(password, hashed_password)

    def test_verify_password_no_match(self):
        """
        Verify that verify_password returns False when pwd_context.verify returns False.
        """
        password = "wrongpassword"
        hashed_password = "hashed_testpassword"
        pwd_context.verify.reset_mock()
        pwd_context.verify.return_value = False

        result = verify_password(password, hashed_password)

        self.assertFalse(result)
        pwd_context.verify.assert_called_once_with(password, hashed_password)

    def test_create_access_token(self):
        """
        Verify that create_access_token calls jwt.encode with the correct data, secret, and algorithm.
        """
        data = {"sub": "testuser"}
        token = "mocked_token"
        jwt.encode.reset_mock()
        jwt.encode.return_value = token

        result = create_access_token(data)

        self.assertEqual(result, token)
        # Check that jwt.encode was called with expected data (contains 'sub' and 'exp')
        args, kwargs = jwt.encode.call_args
        self.assertEqual(args[0]["sub"], "testuser")
        self.assertIn("exp", args[0])
        self.assertEqual(args[1], SECRET_KEY)
        self.assertEqual(kwargs["algorithm"], ALGORITHM)

    def test_create_access_token_with_delta(self):
        """
        Verify that create_access_token uses the provided timedelta for expiration.
        """
        data = {"sub": "testuser"}
        expires_delta = timedelta(minutes=5)
        token = "mocked_token_delta"
        jwt.encode.reset_mock()
        jwt.encode.return_value = token

        result = create_access_token(data, expires_delta)

        self.assertEqual(result, token)
        args, kwargs = jwt.encode.call_args
        self.assertEqual(args[0]["sub"], "testuser")
        self.assertIn("exp", args[0])
        self.assertEqual(args[1], SECRET_KEY)
        self.assertEqual(kwargs["algorithm"], ALGORITHM)

if __name__ == "__main__":
    unittest.main()
