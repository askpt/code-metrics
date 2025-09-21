# Security Policy

## Supported Versions

We take security seriously and provide security updates for the latest version of the Code Complexity Metrics extension. We recommend always keeping the extension updated to the most recent release to ensure you have the latest security fixes and improvements.

## Security Considerations

### Extension Security Model

This VS Code extension operates within VS Code's security model and follows these principles:

- **Local Analysis Only**: The extension analyzes code files locally within your workspace and does not transmit any code or data to external servers
- **Read-Only Operations**: The extension only reads source code files to calculate complexity metrics; it does not modify or write to your code files
- **No Network Communication**: The extension does not make any network requests or communicate with external services
- **Sandboxed Execution**: All analysis runs within VS Code's extension host process with appropriate sandboxing

### Potential Security Areas

While this extension has a minimal attack surface, we monitor these areas:

1. **File System Access**: The extension reads source code files in your workspace
2. **Tree-sitter Parsing**: Uses tree-sitter library for parsing C# code
3. **VS Code API Integration**: Integrates with VS Code's CodeLens and configuration APIs

### Safe Usage Guidelines

To ensure secure usage of this extension:

- **Trusted Workspaces**: Only use this extension in workspaces you trust
- **Source Code Privacy**: The extension processes your source code locally - no code is transmitted externally
- **Configuration Security**: Review extension settings to ensure they meet your security requirements
- **Regular Updates**: Keep the extension updated to the latest version for security patches

## Reporting a Vulnerability

If you discover a security vulnerability in the Code Complexity Metrics extension, please report it responsibly:

### How to Report

1. **GitHub Security Advisories** (Preferred):
   - Go to the [Security Advisories](https://github.com/askpt/code-metrics/security/advisories) page
   - Click "Report a vulnerability"
   - Fill out the security advisory form with details

### What to Include

Please include the following information in your security report:

- **Description**: Clear description of the vulnerability
- **Steps to Reproduce**: Detailed steps to reproduce the issue
- **Impact Assessment**: Potential impact and affected versions
- **Environment**: VS Code version, extension version, and operating system
- **Proof of Concept**: If applicable, include a minimal proof of concept
- **Suggested Fix**: If you have ideas for a fix, please include them

### Response Timeline

We are committed to addressing security issues promptly:

- **Acknowledgment**: Within 72 hours of receiving the report
- **Initial Assessment**: Within 14 days
- **Status Updates**: Weekly updates on progress
- **Resolution**: Security fixes will be prioritized and released as soon as possible

### Disclosure Policy

We follow responsible disclosure practices:

1. **Private Discussion**: We will work with you privately to understand and fix the issue
2. **Coordinated Disclosure**: We will coordinate the public disclosure timing with you
3. **Credit**: We will acknowledge your contribution in the security advisory (unless you prefer anonymity)
4. **No Retaliation**: We will not take legal action against researchers who follow responsible disclosure

## Security Updates

### Notification Methods

Stay informed about security updates:

- **GitHub Releases**: Security fixes will be documented in release notes
- **Security Advisories**: Critical security issues will have dedicated advisories
- **Dependency Updates**: We regularly update dependencies to address security vulnerabilities using Dependabot

### Update Recommendations

- **Automatic Updates**: Enable automatic extension updates in VS Code for timely security patches
- **Release Monitoring**: Watch the repository for new releases and security advisories
- **Automated Security Scanning**: We use Dependabot for automated dependency updates and CodeQL for static code analysis

## Third-Party Dependencies

This extension relies on the following key dependencies:

- **tree-sitter**: Code parsing library - monitored for security updates
- **tree-sitter-c-sharp**: C# language grammar - monitored for security updates
- **VS Code Extension API**: Follows VS Code's security model

We regularly audit and update these dependencies to address known security vulnerabilities.

### Automated Security Tools

We employ the following automated security tools to maintain the security posture of this extension:

- **Dependabot**: Automatically monitors and updates dependencies when security vulnerabilities are discovered
- **CodeQL**: GitHub's semantic code analysis engine that helps identify security vulnerabilities in our codebase
- **GitHub Security Advisories**: Integrated vulnerability database that alerts us to security issues in our dependencies

## Contact Information

For security-related questions or concerns:

- **Repository**: [https://github.com/askpt/code-metrics](https://github.com/askpt/code-metrics)
- **Issues**: [GitHub Issues](https://github.com/askpt/code-metrics/issues) (for non-security issues)
- **Security**: [Security Advisories](https://github.com/askpt/code-metrics/security/advisories) (for security issues)

---

**Last Updated**: September 2025

Thank you for helping keep the Code Complexity Metrics extension secure!
