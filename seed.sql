CREATE TABLE IF NOT EXISTS EmailTemplates (
    Template_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Title TEXT NOT NULL,
    Subject TEXT NOT NULL,
    Body TEXT NOT NULL
);
INSERT INTO EmailTemplates (Title, Subject, Body) VALUES ('Initial Inquiry Reply', 'Following up on your inquiry with EPIC Management', 'Hi [Name],

Thank you so much for reaching out to us regarding your [Service Type] needs! We''d love to learn more about your vision.

Are you available for a quick 15-minute discovery call this week?

Best regards,
EPIC Management');

INSERT INTO EmailTemplates (Title, Subject, Body) VALUES ('Proposal Follow-up', 'Checking in on your custom proposal', 'Hi [Name],

I hope you''re having a great week!

I just wanted to float this to the top of your inbox and see if you had any questions about the proposal I sent over on [Date].

Let me know if you need any adjustments or if you''re ready to move forward!

Best,
EPIC Management');

INSERT INTO EmailTemplates (Title, Subject, Body) VALUES ('Ghosting / Stale Check-in', 'Are you still looking for [Service Type]?', 'Hi [Name],

I''m doing a quick check-in to see if you''re still looking for [Service Type]. If you''ve gone in another direction, no worries at all—just let me know so I can close out your file.

Hope to hear from you soon!

Best,
EPIC Management');
