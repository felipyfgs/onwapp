package util

import "strings"

func NormalizeVCardLines(vcard string) []string {
	vcard = strings.ReplaceAll(vcard, "\\n", "\n")
	vcard = strings.ReplaceAll(vcard, "\r\n", "\n")
	vcard = strings.ReplaceAll(vcard, "\r", "\n")
	return strings.Split(vcard, "\n")
}

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
				org = strings.TrimSuffix(org, ";")
				return org
			}
		}
	}

	return ""
}
