# Frontend Integration Guide for PDPA Consent

## Overview
This guide explains what changes the frontend needs to make to integrate with the new PDPA consent backend implementation.

## Required Changes

### 1. Registration Forms

All registration forms must include a PDPA consent checkbox and send the consent data to the backend.

#### Example: Alumni Registration Form

**Required UI Elements:**
- Checkbox for PDPA consent
- Link to privacy policy
- Disabled submit button until consent is checked

**Sample React Component:**
```jsx
import { useState } from 'react';

function AlumniRegistrationForm() {
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: '',
    password: '',
    degreeTypeId: '',
    address: '',
  });
  
  const [consentAccepted, setConsentAccepted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prepare data with privacy consent
    const registrationData = {
      ...formData,
      privacyConsent: {
        dataProcessingConsent: consentAccepted
      }
    };

    try {
      const response = await fetch('http://localhost:3000/api/register/alumni', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      const data = await response.json();

      if (response.ok) {
        // Handle success
        console.log('Registration successful:', data);
      } else {
        // Handle errors
        console.error('Registration failed:', data);
        alert(data.errors?.join(', ') || data.message);
      }
    } catch (error) {
      console.error('Network error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Other form fields */}
      
      <div className="consent-section">
        <label>
          <input
            type="checkbox"
            checked={consentAccepted}
            onChange={(e) => setConsentAccepted(e.target.checked)}
            required
          />
          I consent to the processing of my personal data in accordance with the{' '}
          <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">
            Privacy Policy
          </a>
        </label>
      </div>

      <button type="submit" disabled={!consentAccepted}>
        Register
      </button>
    </form>
  );
}
```

### 2. Request Body Format

All registration endpoints now require this structure:

```javascript
{
  // ... existing fields (name, email, password, etc.) ...
  "privacyConsent": {
    "dataProcessingConsent": true  // MUST be true, or registration will fail
  }
}
```

**Important:** The `privacyConsent` object is required for all registration types:
- Alumni (Students)
- Enterprise (Employers)
- Staff (Professors)
- Admin

### 3. Error Handling

Handle the new validation errors from the backend:

```javascript
const handleRegistrationError = (errorData) => {
  if (errorData.errors?.includes('PDPA consent required')) {
    // Show specific message about consent requirement
    setError('You must accept the privacy policy to register');
  } else if (errorData.errors?.includes('PDPA consent is required')) {
    // Show message about missing consent field
    setError('Privacy consent is required');
  } else {
    // Handle other errors
    setError(errorData.message || 'Registration failed');
  }
};
```

### 4. Account Deletion Feature

Add a delete account button in user settings/profile page.

**Sample Implementation:**

```jsx
function AccountSettings({ userId }) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleDeleteAccount = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/user/${userId}`, {
        method: 'DELETE',
        credentials: 'include', // Include cookies for authentication
      });

      if (response.status === 204) {
        // Account deleted successfully
        alert('Your account has been deleted');
        // Redirect to homepage or login page
        window.location.href = '/';
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('An error occurred while deleting your account');
    }
  };

  return (
    <div className="account-settings">
      {/* Other settings */}
      
      <div className="danger-zone">
        <h3>Danger Zone</h3>
        <p>Once you delete your account, there is no going back. This action cannot be undone.</p>
        
        <button 
          onClick={() => setShowConfirmDialog(true)}
          className="delete-button"
        >
          Delete Account
        </button>

        {showConfirmDialog && (
          <div className="confirm-dialog">
            <h4>Are you absolutely sure?</h4>
            <p>This will permanently delete your account and all associated data.</p>
            <button onClick={handleDeleteAccount}>Yes, delete my account</button>
            <button onClick={() => setShowConfirmDialog(false)}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}
```

### 5. Privacy Policy Page

Create a static privacy policy page at `/privacy-policy` route.

**Recommended Content Sections:**
1. What data we collect
2. Why we collect it
3. How we use it
4. Your rights (access, correct, delete)
5. Contact information

**Sample Route (React Router):**
```jsx
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PrivacyPolicy from './pages/PrivacyPolicy';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        {/* Other routes */}
      </Routes>
    </Router>
  );
}
```

### 6. OAuth Flow (Google Sign-In)

**No changes required for OAuth flow!** 

The backend automatically handles PDPA consent for Google OAuth users:
- Consent is implicitly assumed through Google OAuth
- `dataProcessingConsent` is automatically set to `true`
- `privacyPolicyAcceptedAt` is automatically set to the current timestamp

Just ensure your Google OAuth button still works as before.

## Testing Checklist

Frontend developers should test:

- [ ] Registration form displays privacy policy checkbox
- [ ] Submit button is disabled until consent is checked
- [ ] Registration fails with appropriate error if consent is unchecked
- [ ] Registration succeeds when consent is checked
- [ ] Privacy policy link opens correctly
- [ ] Account deletion button appears in settings
- [ ] Confirmation dialog shows before deletion
- [ ] Account is deleted successfully
- [ ] User is logged out/redirected after deletion
- [ ] Google OAuth still works without manual consent checkbox

## API Endpoints Summary

### Registration (Modified)
- `POST /api/register/alumni` - Requires `privacyConsent`
- `POST /api/register/enterprise` - Requires `privacyConsent`
- `POST /api/register/staff` - Requires `privacyConsent`
- `POST /api/register/admin` - Requires `privacyConsent`

### Account Deletion (New)
- `DELETE /api/user/:id` - Requires authentication

## Example Error Responses

### Missing Consent
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": ["PDPA consent is required"]
}
```

### Consent Not Accepted
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": ["PDPA consent required"]
}
```

### Unauthorized Deletion
```json
{
  "success": false,
  "message": "Unauthorized to delete this account"
}
```

## Questions?

If you have any questions about the backend implementation or need help with integration:
1. Check the backend documentation in `backend/documents/summary/PDPA_IMPLEMENTATION_SUMMARY.md`
2. Review the API reference in `backend/documents/summary/PDPA_API_REFERENCE.md`
3. Contact the backend team

## Compliance Note

This implementation ensures:
- ✅ Explicit user consent during registration
- ✅ Users can exercise their right to erasure (delete account)
- ✅ Consent timestamp is recorded
- ✅ OAuth users are handled appropriately

Make sure the frontend provides a good user experience while maintaining these compliance requirements!
