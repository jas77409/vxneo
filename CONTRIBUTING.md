# Contributing to VXNeo

Thank you for your interest in contributing to VXNeo! 🎉

## Development Setup

1. **Fork and clone**
```bash
   git clone https://github.com/jas77409/vxneo.git
   cd vxneo
```

2. **Install dependencies**
```bash
   npm install
```

3. **Configure environment**
```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
```

4. **Start development server**
```bash
   npm run dev
```

## Pull Request Process

1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Make your changes
3. Test thoroughly
4. Commit with clear messages: `git commit -m "feat: add amazing feature"`
5. Push to your fork: `git push origin feature/amazing-feature`
6. Open a Pull Request

## Code Style

- Use Prettier for formatting
- Follow ESLint rules
- Write meaningful commit messages (conventional commits)
- Add comments for complex logic

## Commit Message Format
```
<type>: <subject>

<body>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

## Testing
```bash
npm test
```

## Reporting Issues

Use GitHub Issues with:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, etc.)

## Security

Report security vulnerabilities privately to: contact@vxneo.com

**Do not create public issues for security vulnerabilities.**

## Questions?

Feel free to open a discussion or reach out!

Thank you for contributing! 🙏
