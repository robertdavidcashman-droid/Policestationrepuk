from src.classify_firm import classify_firm_text
from src.classify_contact import classify_contact


def test_score_criminal_defence_page():
    text = "Our criminal defence team provides 24 hour police station advice and duty solicitor cover."
    result = classify_firm_text(text, ["https://firm.co.uk/criminal-defence"])
    assert result.score >= 60
    assert result.status == "high_confidence_criminal_firm"


def test_exclude_conveyancing_only():
    text = "We are a conveyancing only firm with no crime department."
    result = classify_firm_text(text)
    assert result.score < 35 or result.status == "excluded"


def test_score_criminal_contact():
    cc = classify_contact(
        "Criminal Defence Solicitor / Duty Solicitor",
        "Head of crime department, police station accredited representative",
        on_crime_page=True,
    )
    assert cc.score >= 50
    assert cc.status == "ready_to_send"


def test_exclude_admin_contact():
    cc = classify_contact("Finance Manager", "Accounts and billing", on_crime_page=False)
    assert cc.score < 25
    assert cc.status == "excluded"
