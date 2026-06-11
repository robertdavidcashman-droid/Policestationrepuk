from src.extract_emails import extract_emails_from_html, normalise_email


def test_extract_plain_email():
    html = "<p>Contact us at crime@examplefirm.co.uk for police station advice.</p>"
    found = extract_emails_from_html(html, "https://examplefirm.co.uk/contact")
    assert any(e.email == "crime@examplefirm.co.uk" for e in found)


def test_extract_mailto():
    html = '<a href="mailto:enquiries@lawfirm.co.uk?subject=Hello">Email</a>'
    found = extract_emails_from_html(html)
    assert any(e.email == "enquiries@lawfirm.co.uk" for e in found)


def test_extract_obfuscated():
    html = "<p>Reach jane.smith [at] lawfirm [dot] co.uk for duty solicitor cover.</p>"
    found = extract_emails_from_html(html)
    assert any("jane.smith@lawfirm.co.uk" == e.email for e in found)


def test_exclude_complaints_accounts():
    html = "complaints@firm.co.uk accounts@firm.co.uk careers@firm.co.uk crime@firm.co.uk"
    emails = {e.email for e in extract_emails_from_html(html)}
    assert "crime@firm.co.uk" in emails
    assert "complaints@firm.co.uk" not in emails
    assert "careers@firm.co.uk" not in emails


def test_prioritise_crime_over_info():
    html = "info@firm.co.uk crime@firm.co.uk"
    found = extract_emails_from_html(html)
    crime = next(e for e in found if e.email == "crime@firm.co.uk")
    info = next(e for e in found if e.email == "info@firm.co.uk")
    assert crime.priority_score > info.priority_score


def test_individual_work_email_allowed():
    html = "Senior solicitor: john.doe@crimedefence.co.uk"
    found = extract_emails_from_html(html)
    em = next(e for e in found if e.email == "john.doe@crimedefence.co.uk")
    assert em.email_type == "individual_work"


def test_reject_free_domains():
    html = "solicitor@gmail.com crime@firm.co.uk"
    found = extract_emails_from_html(html)
    types = {e.email: e.email_type for e in found}
    assert types.get("solicitor@gmail.com") == "personal_free"
    assert "crime@firm.co.uk" in types


def test_normalise_email():
    assert normalise_email("  Crime@Firm.CO.UK ") == "crime@firm.co.uk"
