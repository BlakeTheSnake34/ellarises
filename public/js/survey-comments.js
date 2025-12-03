document.addEventListener("DOMContentLoaded", () => {
  const cells = document.querySelectorAll(".comment-cell");

  cells.forEach(cell => {
    const shortText = cell.querySelector(".comment-short");
    const fullText = cell.querySelector(".comment-full");
    const btnMore = cell.querySelector(".btn-more");
    const btnLess = cell.querySelector(".btn-less");

    if (!shortText || !fullText || !btnMore || !btnLess) return;

    btnMore.addEventListener("click", () => {
      shortText.style.display = "none";
      fullText.style.display = "inline";
      btnMore.style.display = "none";
      btnLess.style.display = "inline";
    });

    btnLess.addEventListener("click", () => {
      shortText.style.display = "inline";
      fullText.style.display = "none";
      btnMore.style.display = "inline";
      btnLess.style.display = "none";
    });
  });
});
