// Same rules as the backend, so students see problems before they submit.
// The backend always re-checks; these are for instant feedback only.
window.Rules = {
  USERNAME_RE: /^[A-Za-z][A-Za-z0-9_.]{2,29}$/,
  // Practical email check: something@domain.tld (college addresses like x@college.ac.in pass)
  EMAIL_RE: /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/,

  passwordChecks: [
    { id: "length", label: "8+ characters", test: (p) => p.length >= 8 },
    { id: "upper", label: "1 uppercase letter", test: (p) => /[A-Z]/.test(p) },
    { id: "lower", label: "1 lowercase letter", test: (p) => /[a-z]/.test(p) },
    { id: "number", label: "1 number", test: (p) => /[0-9]/.test(p) },
    { id: "symbol", label: "1 symbol (! @ # $ …)", test: (p) => /[^A-Za-z0-9\s]/.test(p) },
  ],

  username(v) {
    if (!v) return "Choose a username.";
    if (!this.USERNAME_RE.test(v))
      return "3–30 characters, starting with a letter. Letters, numbers, _ and . only.";
    return null;
  },
  name(v) {
    if (!v || v.trim().length < 2) return "Enter your full name.";
    return null;
  },
  email(v) {
    if (!v) return "Enter your email address.";
    if (!this.EMAIL_RE.test(v.trim())) return "Enter a valid email, e.g. name@college.ac.in";
    return null;
  },
  password(v) {
    if (!v) return "Create a password.";
    const missing = this.passwordChecks.filter((c) => !c.test(v)).map((c) => c.label);
    return missing.length ? "Password needs " + missing.join(", ") + "." : null;
  },
  confirm(pw, confirm) {
    if (!confirm) return "Re-enter your password.";
    return pw === confirm ? null : "Passwords don't match.";
  },
};
