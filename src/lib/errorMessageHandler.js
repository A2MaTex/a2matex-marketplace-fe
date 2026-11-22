export const getErrorMessage = ({ message }) => {
  if (!message) return null;
  if (!Array.isArray(message)) {
    return {
      isFormError: false,
      data: message.toString(),
    };
  }

  return {
    isFormError: true,
    data: Object.fromEntries(message.map((item) => [item.path, item.message])),
  };
};

/**
 * Splits backend field errors into the ones a form actually renders and the ones it
 * does not. The backend keys them by its own `path`, and a path with no matching input
 * — `account` on Error.AccountUsesSocialLogin, `code` on an expired OTP at a step that
 * no longer shows the OTP box — would be written to state nothing reads, leaving the
 * user with no error at all. Callers show `unmatched` in their server-error banner.
 */
export const splitFieldErrors = (data, formFields) => {
  const fields = new Set(formFields);
  const fieldErrors = {};
  const unmatched = [];

  Object.entries(data).forEach(([path, message]) => {
    if (fields.has(path)) fieldErrors[path] = message;
    else unmatched.push(message);
  });

  return { fieldErrors, unmatched };
};
