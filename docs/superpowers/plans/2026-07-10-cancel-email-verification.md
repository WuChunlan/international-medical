# Cancel Email Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove email verification code from user registration so users can register directly with a valid unique email and password.

**Architecture:** The frontend registration form will no longer render or submit `verifyCode`, and it will no longer call `/api/auth/send-code`. The backend registration DTO and service will no longer require or validate `verifyCode`; registration will continue to validate email format, password length, and email uniqueness.

**Tech Stack:** React + Ant Design + Vite frontend; Spring Boot 3.2 + Jakarta Validation + MyBatis-Plus backend; Maven tests/build.

## Global Constraints

- Use option A: direct registration without verification code.
- Preserve registration email format validation on frontend and backend.
- Preserve backend email uniqueness validation.
- Preserve backend password validation.
- Do not change login behavior as part of this task.
- Do not remove Redis or mail dependencies/config globally unless no remaining code uses them; avoid broad unrelated cleanup.
- Do not commit unless explicitly requested by the user.

---

## File Structure

- Modify `frontend-site-a/src/pages/Register/index.tsx`: remove verification-code state, timer, send-code handler, imports, and form field.
- Modify `backend/src/main/java/com/intlmedical/dto/request/RegisterRequest.java`: remove `verifyCode` field and its validation annotations.
- Modify `backend/src/main/java/com/intlmedical/service/AuthService.java`: remove Redis-based verification-code check and post-registration code deletion from `register`; remove send-code support only if no endpoint remains.
- Modify `backend/src/main/java/com/intlmedical/controller/AuthController.java`: remove `/api/auth/send-code` endpoint so clients cannot call a disabled feature.
- Potentially modify `backend/src/main/java/com/intlmedical/service/AuthService.java` imports/constructor fields to remove unused mail/redis dependencies after endpoint removal.
- Verify with frontend build and backend Maven tests.

---

### Task 1: Remove Verification UI from Frontend Registration

**Files:**
- Modify: `frontend-site-a/src/pages/Register/index.tsx`

**Interfaces:**
- Consumes: existing `/api/auth/register` endpoint accepting registration JSON.
- Produces: registration payload without `verifyCode`.

- [ ] **Step 1: Remove unused verification-code imports**

Change the icon import from:

```tsx
import {
  UserOutlined, MailOutlined, LockOutlined, IdcardOutlined,
  GlobalOutlined, SafetyOutlined, PhoneOutlined, FileOutlined,
} from '@ant-design/icons';
```

to:

```tsx
import {
  UserOutlined, MailOutlined, LockOutlined, IdcardOutlined,
  GlobalOutlined, PhoneOutlined, FileOutlined,
} from '@ant-design/icons';
```

- [ ] **Step 2: Remove verification-code state and timer**

Delete these declarations inside `RegisterPage`:

```tsx
const [sendingCode, setSendingCode] = useState(false);
const [countdown, setCountdown] = useState(0);
const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
```

Also change the first React import from:

```tsx
import { useState, useRef, useEffect } from 'react';
```

to:

```tsx
import { useState, useEffect } from 'react';
```

- [ ] **Step 3: Remove send-code functions**

Delete the complete `startCountdown` function:

```tsx
const startCountdown = () => {
  setCountdown(60);
  timerRef.current = setInterval(() => {
    setCountdown((prev) => {
      if (prev <= 1) {
        if (timerRef.current) clearInterval(timerRef.current);
        return 0;
      }
      return prev - 1;
    });
  }, 1000);
};
```

Delete the complete `handleSendCode` function:

```tsx
const handleSendCode = async () => {
  const email = form.getFieldValue('email');
  if (!email) { message.warning('Please enter your email first'); return; }
  setSendingCode(true);
  try {
    await api.post(`/api/auth/send-code?email=${encodeURIComponent(email)}`);
    message.success('Verification code sent!');
    startCountdown();
  } catch (err: unknown) {
    const axiosErr = err as { response?: { data?: { message?: string } } };
    message.error(axiosErr.response?.data?.message || 'Failed to send code');
  } finally {
    setSendingCode(false);
  }
};
```

- [ ] **Step 4: Remove verification-code form item**

Delete the complete `verifyCode` form item:

```tsx
<Form.Item
  name="verifyCode"
  label={t('auth.verify_code')}
  rules={[{ required: true, message: `${t('auth.verify_code')} required` }]}
>
  <Input
    prefix={<SafetyOutlined />}
    placeholder={t('auth.verify_code')}
    addonAfter={
      <Button
        type="link"
        size="small"
        disabled={countdown > 0 || sendingCode}
        loading={sendingCode}
        onClick={handleSendCode}
        className="send-code-btn"
      >
        {countdown > 0 ? `${countdown}s` : t('auth.send_code')}
      </Button>
    }
  />
</Form.Item>
```

- [ ] **Step 5: Run frontend build**

Run:

```bash
npm --prefix frontend-site-a run build
```

Expected: build succeeds. Vite chunk-size warnings are acceptable.

---

### Task 2: Remove Verification Requirement from Backend Registration

**Files:**
- Modify: `backend/src/main/java/com/intlmedical/dto/request/RegisterRequest.java`
- Modify: `backend/src/main/java/com/intlmedical/service/AuthService.java`
- Modify: `backend/src/main/java/com/intlmedical/controller/AuthController.java`

**Interfaces:**
- Consumes: frontend registration JSON without `verifyCode`.
- Produces: `/api/auth/register` succeeds when email is valid/unique and password is valid, without requiring an emailed code.

- [ ] **Step 1: Remove verifyCode field from RegisterRequest**

In `RegisterRequest.java`, delete:

```java
@NotBlank
@Size(min = 6, max = 6)
private String verifyCode;
```

Keep the email field unchanged:

```java
@NotBlank
@Email
private String email;
```

Keep the password field unchanged:

```java
@NotBlank
@Size(min = 8, max = 100)
private String password;
```

- [ ] **Step 2: Remove send-code endpoint from AuthController**

In `AuthController.java`, delete:

```java
@PostMapping("/send-code")
public Result<Void> sendVerifyCode(@RequestParam String email) {
    authService.sendVerifyCode(email);
    return Result.ok();
}
```

- [ ] **Step 3: Remove sendVerifyCode implementation and unused dependencies**

In `AuthService.java`, delete imports used only for email-code sending:

```java
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import java.security.SecureRandom;
import java.util.concurrent.TimeUnit;
```

Delete fields/constants used only for verification codes:

```java
private final StringRedisTemplate redisTemplate;
private final JavaMailSender mailSender;

private static final String CODE_PREFIX = "verify:email:";
private static final String RESEND_PREFIX = "verify:resend:";
```

Delete the complete method:

```java
public void sendVerifyCode(String email) {
    String resendKey = RESEND_PREFIX + email;
    if (Boolean.TRUE.equals(redisTemplate.hasKey(resendKey))) {
        throw new RuntimeException("请60秒后再重新发送验证码");
    }
    String code = String.format("%06d", new SecureRandom().nextInt(1000000));
    redisTemplate.opsForValue().set(CODE_PREFIX + email, code, 600, TimeUnit.SECONDS);
    redisTemplate.opsForValue().set(resendKey, "1", 60, TimeUnit.SECONDS);

    SimpleMailMessage msg = new SimpleMailMessage();
    msg.setTo(email);
    msg.setSubject("International Medical - Verification Code");
    msg.setText("Your verification code is: " + code + "\nValid for 10 minutes.");
    mailSender.send(msg);
}
```

- [ ] **Step 4: Remove verification-code checks from register**

In `AuthService.register`, delete this block at the beginning:

```java
String storedCode = redisTemplate.opsForValue().get(CODE_PREFIX + req.getEmail());
if (storedCode == null || !storedCode.equals(req.getVerifyCode())) {
    throw new RuntimeException("验证码无效或已过期");
}
```

Delete this line at the end of successful registration:

```java
redisTemplate.delete(CODE_PREFIX + req.getEmail());
```

The method should still check duplicate email before inserting the user:

```java
long count = userMapper.selectCount(
    new LambdaQueryWrapper<User>()
        .eq(User::getEmail, req.getEmail())
);
if (count > 0) {
    throw new RuntimeException("该邮箱已注册");
}
```

- [ ] **Step 5: Run backend tests**

Run:

```bash
mvn -f backend/pom.xml test
```

Expected: `BUILD SUCCESS`.

---

### Task 3: Final Verification

**Files:**
- Inspect changed files only.

**Interfaces:**
- Produces: confidence that frontend no longer calls send-code and backend no longer requires verifyCode.

- [ ] **Step 1: Confirm no active send-code frontend call remains**

Run:

```bash
grep -RIn --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=target --exclude-dir=.git "send-code\|verifyCode\|SafetyOutlined\|sendingCode\|countdown" frontend-site-a/src backend/src/main/java
```

Expected: no matches in active registration or auth code. Translation strings may remain in `frontend-site-a/src/i18n.ts`; those are harmless but can be removed later if desired.

- [ ] **Step 2: Confirm no unintended validation removal**

Run:

```bash
grep -RIn --exclude-dir=target --exclude-dir=.git "@Email\|private String email\|private String password" backend/src/main/java/com/intlmedical/dto/request/RegisterRequest.java backend/src/main/java/com/intlmedical/dto/request/LoginRequest.java
```

Expected: `RegisterRequest.email` still has `@Email`; `LoginRequest.email` does not have `@Email`; registration password still has `@Size(min = 8, max = 100)`.

---

## Self-Review

- Spec coverage: A direct registration is covered by frontend form removal and backend DTO/service removal.
- Placeholder scan: no placeholders remain.
- Type consistency: frontend payload no longer includes `verifyCode`; backend DTO no longer defines `verifyCode`; service no longer calls `req.getVerifyCode()`.
- Scope check: this is one focused implementation plan; it does not remove global mail/Redis dependencies because that could affect other future or existing features and is outside the user's request.
