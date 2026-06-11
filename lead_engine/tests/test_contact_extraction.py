from src.extract_contacts import extract_contacts_from_html


TEAM_HTML = """
<html><body>
<article class="team-member">
  <h3>Jane Smith</h3>
  <p class="role">Criminal Defence Solicitor / Duty Solicitor</p>
  <p>Police station advice and Crown Court work.</p>
  <a href="/team/jane-smith">Profile</a>
</article>
<article>
  <h3>Accounts Team</h3>
  <p>Billing and finance</p>
</article>
</body></html>
"""


def test_extract_contact_name_and_role():
    contacts = extract_contacts_from_html(TEAM_HTML, "https://firm.co.uk/team", on_crime_page=True)
    assert len(contacts) >= 1
    c = contacts[0]
    assert "Jane" in c.contact_name
    assert "Solicitor" in c.contact_role or "solicitor" in c.contact_role.lower()


def test_exclude_irrelevant_contacts():
    contacts = extract_contacts_from_html(TEAM_HTML, "https://firm.co.uk/team")
    names = [c.contact_name for c in contacts]
    assert not any("Accounts" in n for n in names)
