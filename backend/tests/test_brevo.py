import pytest
from unittest.mock import patch, MagicMock
from app.services.email_service import send_email_with_provider, send_email_async
from app.config import settings

@pytest.mark.anyio
async def test_brevo_dispatch():
    # Test that when BREVO_API_KEY is configured, Brevo HTTPS REST API is called with correct payload and headers
    mock_response = MagicMock()
    mock_response.status_code = 201
    mock_response.content = b'{"messageId": "<test-123@smtp-relay.brevo.com>"}'
    mock_response.json.return_value = {"messageId": "<test-123@smtp-relay.brevo.com>"}

    with patch.object(settings, "BREVO_API_KEY", "xkeysib-mock-api-key"), \
         patch.object(settings, "BREVO_SENDER_EMAIL", "test-sender@domain.com"), \
         patch.object(settings, "BREVO_SENDER_NAME", "Master Your Time"), \
         patch("httpx.AsyncClient.post", return_value=mock_response) as mock_post:
        
        delivered, provider = await send_email_with_provider(
            to_email="recipient@test.com",
            subject="Test Subject",
            text_content="Hello text",
            html_content="<p>Hello html</p>"
        )

        assert delivered is True
        assert provider == "brevo"
        assert mock_post.called

        # Verify endpoint and payload
        args, kwargs = mock_post.call_args
        assert args[0] == "https://api.brevo.com/v3/smtp/email"
        assert kwargs["headers"]["api-key"] == "xkeysib-mock-api-key"
        assert kwargs["json"]["sender"]["email"] == "test-sender@domain.com"
        assert kwargs["json"]["to"][0]["email"] == "recipient@test.com"
        assert kwargs["json"]["subject"] == "Test Subject"
        assert kwargs["json"]["htmlContent"] == "<p>Hello html</p>"

