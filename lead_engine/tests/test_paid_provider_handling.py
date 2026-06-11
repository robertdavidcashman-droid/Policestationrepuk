from src.paid_providers import HunterAdapter, StubAdapter, ProviderEmailResult
from src.config import load_config


def test_stub_never_fabricates():
    stub = StubAdapter("hunter")
    assert stub.enrich_domain("example.co.uk") == []
    assert stub.enrich_contact("Jane Smith", "example.co.uk") == []


def test_guessed_flag_low_confidence():
    r = ProviderEmailResult(
        provider_name="hunter",
        email="jane@firm.co.uk",
        contact_name="Jane",
        role=None,
        confidence_score=30,
        verification_status="unknown",
        source_type="paid_provider",
        is_guessed=True,
        is_verified=False,
        raw_response_summary="test",
    )
    assert r.is_guessed
    assert not r.is_verified


def test_config_disallows_guessed_ready_by_default():
    cfg = load_config()
    assert cfg.allow_guessed_emails_ready_to_send is False
    assert cfg.dry_run is True


def test_hunter_without_key_returns_empty():
    h = HunterAdapter("")
    assert h.enrich_domain("firm.co.uk") == []
