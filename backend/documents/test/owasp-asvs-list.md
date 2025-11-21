# 🛡️ **OWASP ASVS Requirement List (Markdown Version)**

## **V1 – Encoding, Sanitization, Injection, Safe Deserialization**

### **V1.1 Encoding and Sanitization Architecture**

* **1.1.1** – Verify that input is decoded or unescaped into a canonical form only once and before further processing.
* **1.1.2** – Verify that the application performs output encoding and escaping as a final step before interpreter usage.

### **V1.2 Injection Prevention**

* **1.2.1** – Verify context-relevant output encoding for HTML, XML, CSS, attributes, comments, headers.
* **1.2.2** – Verify URL building uses proper encoding and safe URL protocols.
* **1.2.3** – Verify encoding/escaping is used when dynamically building JavaScript/JSON.
* **1.2.4** – Verify database queries use parameterized queries/ORMs to prevent injection.
* **1.2.5** – Verify OS command execution is protected against command injection.

### **V1.3 Sanitization**

* **1.3.1** – Verify untrusted HTML input (WYSIWYG, etc.) is sanitized using secure sanitization libraries.
* **1.3.2** – Verify the application avoids `eval()` and dynamic code execution unless sanitized.
* **1.3.3** – Verify data passed to dangerous contexts is sanitized and restricted to safe characters.

### **V1.5 Safe Deserialization**

* **1.5.1** – Verify XML parsers use restrictive configs and disable unsafe features (XXE prevention).

---

## **V2 – Validation & Business Logic**

### **V2.1 Validation & Business Logic Documentation**

* **2.1.1** – Verify documentation defines input validation rules for data format expectations.
* **2.1.2** – Verify documentation defines validation of logical/contextual consistency.
* **2.1.3** – Verify documentation includes expected business logic limits and rules.

### **V2.2 Input Validation**

* **2.2.1** – Verify all input is validated using allow-lists or structure rules.
* **2.2.2** – Verify input validation occurs at a trusted server-side layer.
* **2.2.3** – Verify combinations of related data items follow predefined rules.

### **V2.3 Business Logic Security**

* **2.3.1** – Verify the application enforces sequential business logic flows.
* **2.3.2** – Verify business logic limits are implemented per documentation.
* **2.3.3** – Verify business logic transactions are atomic (commit/rollback).
* **2.3.4** – Verify locking mechanisms prevent double-booking of limited resources.

### **V2.4 Anti-automation**

* **2.4.1** – Verify anti-automation controls exist to prevent excessive calls (exfiltration, DoS, etc.).

---

## **V3 – Web Frontend Security**

### **V3.2 Unintended Content Interpretation**

* **3.2.1** – Verify controls prevent browsers from interpreting responses in incorrect contexts.
* **3.2.2** – Verify content intended as text uses safe rendering functions.

### **V3.3 Cookie Setup**

* **3.3.1** – Verify cookies use `Secure` + `__Secure-` or `__Host-` prefix.
* **3.3.2** – Verify cookies use appropriate `SameSite` attributes.
* **3.3.4** – Verify `HttpOnly` is used for cookies not intended for client-side access.

### **V3.4 Browser Security Headers**

* **3.4.1** – Verify HSTS header is included (min 1-year max-age).
* **3.4.2** – Verify CORS ACAO header is fixed or origin-validated.
* **3.4.4** – Verify all responses contain `X-Content-Type-Options: nosniff`.
* **3.4.5** – Verify a referrer policy is set to prevent leakage.

---

## **V4 – Web Service & HTTP Security**

### **V4.1 Generic Web Service Security**

* **4.1.1** – Verify Content-Type matches actual response body.
* **4.1.2** – Verify only user-facing endpoints automatically redirect HTTP→HTTPS.
* **4.1.3** – Verify headers set by intermediaries cannot be overridden.
* **4.1.4** – Verify unused HTTP methods are blocked.

### **V4.2 HTTP Message Structure**

* **4.2.2** – Verify Content-Length header matches actual content to prevent request smuggling.

### **V4.3 GraphQL**

* **4.3.1** – Verify query allowlist/depth limit/query-cost analysis is used (DoS prevention).
* **4.3.2** – Duplicate of 4.3.1.

### **V4.4 WebSocket**

* **4.4.1** – Verify WebSocket connections use WSS.

---

## **V5 – File Handling**

### **V5.1 File Handling Documentation**

* **5.1.1** – Verify documentation defines allowed file types, extensions, sizes, and safety behavior.

### **V5.2 File Upload and Content**

* **5.2.1** – Verify only files that can be safely processed are accepted.
* **5.2.2** – Verify file extension matches content; validate magic-bytes, rewrite images, etc.
* **5.2.4** – Verify file size quotas and maximum files per user.

### **V5.3 File Storage**

* **5.3.1** – Verify uploaded files in public folders cannot execute server-side code.
* **5.3.2** – Verify user-provided filenames/paths are validated to prevent path traversal/SSRF.

### **V5.4 File Download**

* **5.4.1** – Verify filename in downloads is validated or ignored; `Content-Disposition` is set.
* **5.4.2** – Verify served filenames are encoded/sanitized per RFC 6266.

---

## **V6 – Authentication**

### **V6.1 Authentication Documentation**

* **6.1.1** – Verify documentation defines rate-limiting, anti-automation for authentication.
* **6.1.2** – Verify list of disallowed password words exists.
* **6.1.3** – Verify all authentication pathways are documented and consistent.

### **V6.2 Password Security**

* **6.2.1** – Password minimum length ≥ 8 (recommended 15).
* **6.2.2** – Users can change password.
* **6.2.3** – Password change requires current + new password.
* **6.2.4** – Passwords checked against top 3000 common passwords.
* **6.2.5** – No restrictive composition rules required.
* **6.2.6** – Mask password fields; allow temporary reveal.
* **6.2.7** – Paste + password managers allowed.
* **6.2.8** – Passwords verified exactly as provided (no transformation).
* **6.2.9** – At least 64-character password allowed.
* **6.2.10** – No forced periodic password rotation.

### **V6.3 General Authentication**

* **6.3.1** – Anti-bruteforce controls implemented.
* **6.3.2** – No default user accounts (root/admin).
* **6.3.4** – All authentication pathways must be documented and consistent.
* **6.3.6** – Email cannot be used as MFA factor or single-factor auth.
* **6.3.8** – Valid users cannot be inferred from authentication errors.

### **V6.4 Authentication Factor Lifecycle**

* **6.4.1** – System-generated initial passwords must be random, short-lived.
* **6.4.2** – No security-question authentication (KBA).
* **6.4.3** – Password reset must not bypass MFA.

---

## **V7 – Session Management**

### **V7.1 Documentation**

* **7.1.2** – Documentation defines concurrent session limits.

### **V7.2 Session Security**

* **7.2.1** – Session token verification must use backend-only logic.
* **7.2.2** – Use dynamically generated tokens (no static secrets).
* **7.2.3** – Reference tokens must be CSPRNG-generated (≥128 bits).
* **7.2.4** – New session token must be issued on authentication.

### **V7.4 Session Termination**

* **7.4.1** – Session termination must invalidate tokens.
* **7.4.2** – All sessions terminated when account is disabled/deleted.
* **7.4.4** – Logout must be easy and visible.

### **V7.5 Session Abuse Defenses**

* **7.5.1** – Full re-authentication required before modifying sensitive attributes.

### **V7.6 Federated Re-authentication**

* **7.6.2** – Session creation requires user consent or explicit action.

---

## **V8 – Authorization**

### **V8.1 Documentation**

* **8.1.1** – Documentation defines function-level and data-level access rules.
* **8.1.2** – Documentation defines field-level read/write access rules.

### **V8.2 General Authorization**

* **8.2.1** – Function-level access restricted to explicit permissions.
* **8.2.2** – Data-specific access restricted (IDOR/BOLA protection).
* **8.2.3** – Field-level access must be enforced.

### **V8.3 Operation-Level Authorization**

* **8.3.1** – Authorization must be enforced server-side, not client-side.

---

## **V9 – Token Security**

### **V9.1 Token Source & Integrity**

* **9.1.1** – Validate self-contained tokens using signature/MAC.
* **9.1.2** – Only approved algorithms allowed; no `none`.
* **9.1.3** – Token key material must come from trusted sources.

### **V9.2 Token Content**

* **9.2.1** – Validate token validity times (`nbf`, `exp`).
* **9.2.2** – Token must be correct type (access vs ID token).
* **9.2.3** – Token audience must match service.
* **9.2.4** – Tokens issued with same private key must include audience restrictions.

---

## **V10 – OAuth & OIDC**

### **V10.1 Generic OAuth/OIDC**

* **10.1.2** – Client accepts AS values only if tied to same session & transaction (nonce/state/PKCE).

### **V10.3 Resource Server**

* **10.3.1** – Resource server verifies audience of access tokens.

### **V10.4 Authorization Server**

* **10.4.1** – Redirect URIs must match allow-list exactly.
* **10.4.2** – Authorization code may be used only once.
* **10.4.3** – Authorization code must be short-lived.
* **10.4.4** – Only necessary grant types allowed.
* **10.4.5** – Refresh token replay mitigated (DPoP/mTLS or rotation).
* **10.4.6** – PKCE required; no `plain` challenge allowed.

### **V10.5 OIDC Client**

* **10.5.1** – Client must validate nonce to prevent ID token replay.

---

## **V11 – Cryptography**

### **V11.1 Crypto Documentation**

* **11.1.1** – Document key-management lifecycle per NIST SP 800-57.

### **V11.2 Secure Cryptography Implementation**

* **11.2.1** – Use industry-validated crypto libraries.
* **11.2.2** – Application must support crypto-agility.

### **V11.3 Encryption Algorithms**

* **11.3.1** – No insecure block modes (e.g., ECB).
* **11.3.2** – Only approved ciphers/modes (AES-GCM).
* **11.3.3** – Encryption must include integrity protection.

### **V11.4 Hashing**

* **11.4.1** – Only approved hash functions (no MD5).
* **11.4.2** – Passwords must use secure password hashing functions.

### **V11.5 Random Values**

* **11.5.1** – Random values must come from CSPRNG (≥128 bits entropy).

---

## **V12 – TLS & Communication Security**

### **V12.1 General TLS**

* **12.1.1** – Only TLS 1.2/1.3; enforce latest version.

### **V12.2 HTTPS External Services**

* **12.2.1** – TLS for all external HTTP services.
* **12.2.2** – External services must use publicly trusted certificates.

### **V12.3 Internal Communication**

* **12.3.1** – TLS required for all internal connections.
* **12.3.2** – TLS clients must validate certificates.
* **12.3.3** – TLS required between internal HTTP services.

---

## **V13 – Backend Configuration & Secrets**

### **V13.1 Documentation**

* **13.1.1** – Document all communication requirements and external services.

### **V13.2 Backend Communication**

* **13.2.3** – No default credentials for service-to-service communication.

### **V13.3 Secret Management**

* **13.3.1** – Secrets must be stored in a secrets manager (or HSM).

### **V13.4 Information Leakage**

* **13.4.1** – No source-control metadata deployed.
* **13.4.2** – Debug modes disabled in production.
* **13.4.3** – No server directory listing.
* **13.4.4** – HTTP TRACE disabled.
* **13.4.5** – Documentation & monitoring endpoints not exposed unless intended.

---

## **V14 – Data Protection**

### **V14.2 General Data Protection**

* **14.2.1** – Sensitive data must not appear in URLs.
* **14.2.3** – Sensitive data must not be sent to untrusted parties.

### **V14.3 Client-side Data Protection**

* **14.3.1** – Authenticated data must be cleared after session termination.
* **14.3.3** – Browser storage must not contain sensitive data (except session tokens).

---

## **V15 – Secure Coding & Dependencies**

### **V15.1 Documentation**

* **15.1.1** – Document remediation timelines for vulnerabilities.
* **15.1.2** – Maintain SBOM (Software Bill of Materials).
* **15.1.3** – Document heavy operations and timeout mitigations.

### **V15.2 Architecture & Dependencies**

* **15.2.1** – No outdated/vulnerable components in use.
* **15.2.3** – Production includes only required functionality.

### **V15.3 Defensive Coding**

* **15.3.1** – Return only necessary fields in responses.
* **15.3.2** – Backend external URL calls should not auto-follow redirects.
* **15.3.6** – JavaScript must prevent prototype pollution (use Map/Set).

---

## **V16 – Logging & Error Handling**

### **V16.1 Logging Documentation**

* **16.1.1** – Document logging events, formats, access controls, retention.

### **V16.2 General Logging**

* **16.2.1** – Logs include who/what/when/where.
* **16.2.2** – Timestamps synchronized & in UTC.
* **16.2.3** – Logs stored only in approved systems.
* **16.2.4** – Logs readable by log processor.
* **16.2.5** – Sensitive data masked/hashed.

### **V16.3 Security Events**

* **16.3.1** – Log all authentication attempts.
* **16.3.2** – Log failed authorization attempts (and all access for L3).
* **16.3.3** – Log attempts to bypass security controls.
* **16.3.4** – Log unexpected errors and security control failures.

### **V16.4 Log Protection**

* **16.4.1** – Logs protected against injection.
* **16.4.2** – Logs protected from modification/access.
* **16.4.3** – Logs securely transmitted to separate system.

### **V16.5 Error Handling**

* **16.5.1** – Return generic error messages.
* **16.5.2** – App must degrade gracefully on external errors.
* **16.5.3** – App must fail securely, not fail-open.

