# Contributing to the Gate.io P2P Monitor

Thank you for considering contributing to this project! Please follow these guidelines to help maintain code quality and consistency.

## Development Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/track-bot.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Install dependencies:
   ```bash
   npm install
   ```

## Code Style

- Follow the existing code style in the repository
- Use consistent indentation (2 spaces)
- Use semicolons at the end of statements
- Use single quotes for strings unless the string contains a single quote
- Use descriptive variable and function names
- Keep functions focused and small

## Code Quality

### JavaScript Best Practices
- Use `const` for variables that don't change, `let` for variables that change
- Avoid `var`
- Use arrow functions for callbacks when appropriate
- Handle errors with try/catch for async operations
- Validate inputs before processing

### Testing
- Test your changes locally before submitting a pull request
- Ensure the application starts without errors: `npm start`
- Verify all routes work as expected
- Check for any console errors in the browser

## Pull Request Process

1. Ensure your code passes the syntax check:
   ```bash
   cd backend
   find . -name "*.js" -exec node -c {} \;
   ```
2. Ensure your code follows the existing style
3. Update documentation if needed
4. Write a clear description of your changes
5. Reference any related issues
6. Submit your pull request

## Reporting Issues

When reporting issues, please include:
- Your operating system and Node.js version
- Steps to reproduce the issue
- Expected behavior vs. actual behavior
- Screenshots or error messages if applicable
- Any relevant configuration details

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

Thank you for your contribution!