document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("erModal");
  const modalText = document.getElementById("erModalText");
  const closeBtn = document.getElementById("erModalClose");

  document.querySelectorAll(".open-comment").forEach(btn => {
    btn.addEventListener("click", () => {
      modalText.textContent = btn.dataset.comment;
      modal.style.display = "flex";
    });
  });

  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });
});
