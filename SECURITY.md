# Security Policy

## Supported Versions

We provide security updates for the following versions of this project:
- Latest release

## Reporting a Vulnerability

To report a security vulnerability, please email [security@example.com](mailto:security@example.com) with:
- A detailed description of the vulnerability
- Steps to reproduce it
- Potential impact
- Any proposed fixes (if known)

We will acknowledge your email within 48 hours and provide a more detailed timeline for addressing the issue within 5 business days.

## Security Best Practices

When using this application, please follow these security practices:

### For Developers
- Keep all dependencies up to date
- Regularly audit your dependencies for known vulnerabilities
- Use environment variables for sensitive data (API tokens, etc.)
- Never commit sensitive information to version control
- Implement proper input validation and sanitization
- Use HTTPS in production
- Implement rate limiting to prevent abuse
- Keep your server operating system updated

### For Users
- Use a dedicated Telegram bot for this application (don't use your personal bot)
- Keep your Telegram bot token secure
- Do not share your Telegram bot token with anyone
- Use a strong, unique password for your Telegram account
- Regularly review your Telegram bot's permissions
- Monitor your Telegram account for any suspicious activity

## Known Limitations

This application:
- Does not implement rate limiting for Gate.io API calls (be respectful of their terms)
- Does not encrypt data at rest (all data is stored in memory)
- Does not implement user authentication (designed for single-user use)
- Uses web scraping which may break if Gate.io changes their website
- Relies on the security of the Telegram Bot API

## Responsible Disclosure

We follow responsible disclosure practices and appreciate security researchers who help improve the security of our project. Publicly disclosing a vulnerability without giving us a chance to fix it is not considered responsible disclosure.

## Contact

If you have any questions about security, please contact us at [security@example.com](mailto:security@example.com).