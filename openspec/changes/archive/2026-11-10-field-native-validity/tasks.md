## 1. Components

- [x] 1.1 Text input: copy the inner input's validity into ElementInternals; pass min / max / step; header comment
- [x] 1.2 Textarea: the same for required / minlength / maxlength; pass minlength; over-long script value is tooLong; header comment

## 2. Verification

- [x] 2.1 Chromium and Firefox: email, url, pattern, min, required, spaces only, minlength (typed), error precedence, valid; textarea minlength, maxlength, required; fixed value and attribute changes revalidate; error summary lists each field on submit; no console errors
