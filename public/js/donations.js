document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".delete-btn").forEach(button => {
    button.addEventListener("click", (event) => {
      event.preventDefault();

      const confirmed = confirm(
        "⚠️ Are you sure you want to permanently delete this donation?\nThis action cannot be undone."
      );

      if (confirmed) {
        button.closest("form").submit();
      }
    });
  });
});
