# Security Policy

## Supported Versions

We actively support the following versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it responsibly:

### How to Report

1. **Do not** create a public GitHub issue for the vulnerability
2. Email security concerns to: [security@biuro.pl](mailto:security@biuro.pl)
3. Include detailed information about:
   - The vulnerability description
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Response Timeline

- **Initial Response**: Within 24 hours
- **Vulnerability Assessment**: Within 72 hours
- **Fix Development**: Within 1-2 weeks for critical issues
- **Public Disclosure**: After fix is deployed and tested

### Security Considerations

This application handles sensitive real estate data and user authentication. Security vulnerabilities may include:

- Authentication bypass
- Data leakage
- SQL injection (NoSQL injection for MongoDB)
- Cross-site scripting (XSS)
- Cross-site request forgery (CSRF)
- Session management issues
- File upload vulnerabilities

## Security Best Practices

### For Contributors

1. Never commit sensitive data (passwords, API keys, etc.)
2. Use environment variables for configuration
3. Validate all user inputs
4. Use parameterized queries
5. Implement proper error handling
6. Keep dependencies updated

### For Users

1. Use strong, unique passwords
2. Enable two-factor authentication when available
3. Keep the application updated
4. Use HTTPS in production
5. Regularly backup data

## Responsible Disclosure

We kindly ask that you:

- Give us reasonable time to fix the issue before public disclosure
- Avoid accessing or modifying user data
- Respect the privacy of our users

Thank you for helping keep our users safe!