package util

import "strings"

// NormalizeVCardLines normalizes vCard line endings and splits into lines
func NormalizeVCardLines(vcard string) []string {
	// Handle literal \n strings (common in some WhatsApp vCards)
	vcard = strings.ReplaceAll(vcard, "\\n", "\n")
	// Normalize CRLF and CR to LF
	vcard = strings.ReplaceAll(vcard, "\r\n", "\n")
	vcard = strings.ReplaceAll(vcard, "\r", "\n")
	return strings.Split(vcard, "\n")
}

// ParseVCardPhones extracts phone numbers from vCard
func ParseVCardPhones(vcard string) []string {
	if vcard == "" {
		return nil
	}

	var phones []string
	lines := NormalizeVCardLines(vcard)

	for _, line := range lines {
		line = strings.TrimSpace(line)
		upperLine := strings.ToUpper(line)

		if strings.HasPrefix(upperLine, "TEL") || strings.Contains(upperLine, ".TEL") {
			// Handle various TEL formats:
			// TEL:+5511999999999
			// TEL;type=CELL:+5511999999999
			// TEL;TYPE=CELL;TYPE=VOICE;WAID=5511999999999:+5511999999999

			parts := strings.SplitN(line, ":", 2)
			if len(parts) == 2 {
				phone := strings.TrimSpace(parts[1])
				if phone != "" {
					phones = append(phones, phone)
				}
			}
		}
	}

	return phones
}

// ParseVCardEmails extracts email addresses from vCard
func ParseVCardEmails(vcard string) []string {
	if vcard == "" {
		return nil
	}

	var emails []string
	lines := NormalizeVCardLines(vcard)

	for _, line := range lines {
		line = strings.TrimSpace(line)
		upperLine := strings.ToUpper(line)

		if strings.HasPrefix(upperLine, "EMAIL") || strings.Contains(upperLine, ".EMAIL") {
			parts := strings.SplitN(line, ":", 2)
			if len(parts) == 2 {
				email := strings.TrimSpace(parts[1])
				if email != "" {
					emails = append(emails, email)
				}
			}
		}
	}

	return emails
}

// ParseVCardOrg extracts organization from vCard
func ParseVCardOrg(vcard string) string {
	if vcard == "" {
		return ""
	}

	lines := NormalizeVCardLines(vcard)

	for _, line := range lines {
		line = strings.TrimSpace(line)
		upperLine := strings.ToUpper(line)

		if strings.HasPrefix(upperLine, "ORG") || strings.Contains(upperLine, ".ORG") {
			parts := strings.SplitN(line, ":", 2)
			if len(parts) == 2 {
				org := strings.TrimSpace(parts[1])
				// Remove trailing semicolons (vCard format allows ORG:Company;Department)
				org = strings.TrimSuffix(org, ";")
				return org
			}
		}
	}

	return ""
}
