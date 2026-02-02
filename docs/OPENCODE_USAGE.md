# OpenCode Integration Guide for GitLab

This document explains how to use OpenCode AI in your GitLab workflow for automated code reviews, issue triage, and feature implementation.

## What is OpenCode?

OpenCode is an AI-powered assistant that integrates with GitLab issues and merge requests. It runs securely on your GitLab CI/CD runners and can:

- Triage and explain issues
- Fix bugs and implement features  
- Review merge requests
- Create branches and open merge requests automatically

## Setup Complete ✅

The following components are already configured in this repository:

### 1. Flow Configuration
- **File**: `.gitlab/duo/flows/opencode.yaml`
- **Purpose**: Defines how OpenCode runs in your CI/CD pipeline
- **AI Provider**: Perplexity (via Sonar API)

### 2. CI/CD Variables
- `GITLAB_TOKEN`: Personal access token for GitLab API access
- `PERPLEXITY_API_KEY`: API key for Perplexity AI model
- `GITLAB_HOST`: Your GitLab instance URL

### 3. CI/CD Pipeline Job
- **File**: `.gitlab-ci.yml`
- **Job Name**: `opencode`
- **Stage**: test
- **Trigger**: Manual on merge requests, or automatic when `@opencode` is mentioned

## How to Use OpenCode

### In GitLab Issues

#### 1. Explain an Issue
Add a comment to any issue:
```
@opencode explain this issue
```
OpenCode will analyze the issue and provide a clear explanation.

#### 2. Fix an Issue
Add a comment to any issue:
```
@opencode fix this
```
OpenCode will:
- Create a new feature branch
- Implement the fix
- Open a merge request with the changes
- Link it back to the issue

#### 3. Implement a Feature
Add a comment to any issue:
```
@opencode implement this feature
```
OpenCode will create a complete implementation with a merge request.

### In Merge Requests

#### Review a Merge Request
Add a comment to any merge request:
```
@opencode review this merge request
```
OpenCode will:
- Analyze the code changes
- Check for potential issues
- Provide constructive feedback
- Suggest improvements

## Advanced Usage

### Custom Instructions
You can provide specific instructions to OpenCode:
```
@opencode please review this code focusing on security vulnerabilities
```

```
@opencode fix the authentication bug, make sure to add tests
```

### Manual Pipeline Runs
You can also trigger OpenCode manually from the CI/CD pipeline page:
1. Go to CI/CD > Pipelines
2. Find your merge request pipeline
3. Click the play button next to the `opencode` job

## How It Works

1. **Trigger**: When you mention `@opencode` in a comment or manually run the job
2. **CI/CD**: GitLab starts the OpenCode job in your pipeline
3. **Analysis**: OpenCode uses Perplexity AI to understand the context
4. **Action**: OpenCode uses `glab` CLI to interact with GitLab
5. **Response**: OpenCode posts results as comments or creates merge requests

## Security

- ✅ Runs on your own GitLab runners (self-hosted)
- ✅ Uses your personal access tokens (never shared)
- ✅ All code stays in your GitLab instance
- ✅ AI processing through Perplexity API (consider data sensitivity)

## Troubleshooting

### OpenCode doesn't respond
1. Check the pipeline status for the `opencode` job
2. Review job logs for errors
3. Verify CI/CD variables are set correctly

### Permission errors
1. Ensure `GITLAB_TOKEN` has sufficient permissions:
   - `api` scope
   - `write_repository` scope
2. Check that the token hasn't expired

### AI model errors
1. Verify `PERPLEXITY_API_KEY` is valid
2. Check Perplexity API status and quotas

## Cost Considerations

The OpenCode job is configured to run manually on merge requests to avoid unnecessary API costs. It only runs automatically when explicitly mentioned with `@opencode`.

## Examples

### Example 1: Bug Triage
```
Issue: "Users can't login after password reset"

Comment: @opencode explain this issue

OpenCode Response:
"This appears to be an authentication flow issue. The problem likely occurs 
because the password reset token isn't being properly validated or cleared 
after use. I'll investigate the auth middleware and token validation logic."
```

### Example 2: Feature Implementation
```
Issue: "Add dark mode toggle to user settings"

Comment: @opencode implement this feature

OpenCode Actions:
1. Creates branch: feature/add-dark-mode-toggle
2. Implements the toggle component
3. Adds theme switching logic
4. Updates user settings page
5. Creates MR with description and screenshots
```

### Example 3: Code Review
```
Merge Request: "Refactor database queries for performance"

Comment: @opencode review this merge request

OpenCode Response:
"Great optimization work! Here are my observations:

✅ Excellent use of batch loading
✅ Proper indexing added
⚠️ Consider adding query timeout handling
⚠️ Line 45: N+1 query still present in user associations
💡 Suggestion: Add caching layer for frequently accessed data"
```

## Learn More

- [OpenCode Documentation](https://opencode.ai/docs/gitlab/)
- [GitLab Duo Agent Platform](https://docs.gitlab.com/user/duo_agent_platform/)
- [Perplexity API Docs](https://docs.perplexity.ai/)

## Support

For issues or questions:
1. Check the [OpenCode GitHub repository](https://github.com/sst/opencode)
2. Review GitLab CI/CD logs
3. Contact the development team

---

**Happy coding with OpenCode! 🚀**