document.addEventListener("DOMContentLoaded", () => {
  const rows = document.querySelectorAll(".comment-cell");

  rows.forEach(cell => {
    const shortTxt = cell.querySelector(".comment-short");
    const fullTxt = cell.querySelector(".comment-full");
    const btnMore = cell.querySelector(".btn-more");
    const btnLess = cell.querySelector(".btn-less");

    if (!shortTxt || !fullTxt || !btnMore || !btnLess) return;

    btnMore.addEventListener("click", () => {
      shortTxt.style.display = "none";
      fullTxt.style.display = "inline";
      btnMore.style.display = "none";
      btnLess.style.display = "inline";
    });

    btnLess.addEventListener("click", () => {
      shortTxt.style.display = "inline";
      fullTxt.style.display = "none";
      btnMore.style.display = "inline";
      btnLess.style.display = "none";
    });
  });
});
