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
