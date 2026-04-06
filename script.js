// ===== Variables =====
const gallery = document.querySelector(".gallery");
const filterButtons = document.querySelectorAll(".filters button");
const paginationContainer = document.querySelector(".pagination");
const themeToggle = document.querySelector(".theme-toggle");

const lightbox = document.querySelector(".lightbox");
const lightboxImg = document.querySelector(".lightbox-img");
const closeBtn = document.querySelector(".close");
const prevBtn = document.querySelector(".prev");
const nextBtn = document.querySelector(".next");
const downloadBtn = document.querySelector(".download");
const likeBtn = document.querySelector(".like");

let allItems = Array.from(document.querySelectorAll(".gallery-item"));
let filteredItems = [...allItems];
let favorites = [];
let currentPage = 1;
let currentIndex = 0;
const imagesPerPage = 18;

// ===== Zoom Variables =====
let zoomLevel = 1;
let isDragging = false;
let startX,
  startY,
  translateX = 0,
  translateY = 0;

// ===== Render Gallery =====
function renderGallery() {
  gallery.innerHTML = "";
  const start = (currentPage - 1) * imagesPerPage;
  const end = start + imagesPerPage;
  const itemsToShow = filteredItems.slice(start, end);

  itemsToShow.forEach((item, index) => {
    const clone = item.cloneNode(true);
    clone.addEventListener("click", () => {
      showImage(index);
      lightbox.classList.add("open");
    });
    gallery.appendChild(clone);
  });

  renderPagination();
}

// ===== Render Pagination =====
function renderPagination() {
  paginationContainer.innerHTML = "";

  const totalPages = Math.ceil(filteredItems.length / imagesPerPage);

  const prevButton = document.createElement("button");
  prevButton.textContent = "Previous";
  prevButton.disabled = currentPage === 1;
  prevButton.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderGallery();
    }
  });
  paginationContainer.appendChild(prevButton);

  for (let i = 1; i <= totalPages; i++) {
    const pageBtn = document.createElement("button");
    pageBtn.textContent = i;
    if (i === currentPage) pageBtn.classList.add("active");
    pageBtn.addEventListener("click", () => {
      currentPage = i;
      renderGallery();
    });
    paginationContainer.appendChild(pageBtn);
  }

  const nextButton = document.createElement("button");
  nextButton.textContent = "Next";
  nextButton.disabled = currentPage === totalPages;
  nextButton.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderGallery();
    }
  });
  paginationContainer.appendChild(nextButton);
}

// ===== Update Favorites Button =====
function updateFavoritesButton() {
  if (
    !document.querySelector('[data-filter="favorites"]') &&
    favorites.length > 0
  ) {
    const favBtn = document.createElement("button");
    favBtn.dataset.filter = "favorites";
    favBtn.textContent = "Favorites";
    document.querySelector(".filters").appendChild(favBtn);
    favBtn.addEventListener("click", () => {
      document
        .querySelector(".filters button.active")
        ?.classList.remove("active");
      favBtn.classList.add("active");
      filteredItems = favorites;
      currentPage = 1;
      renderGallery();
    });
  }
}

// ===== Download Button =====
downloadBtn.onclick = async () => {
  try {
    const response = await fetch(lightboxImg.src, { mode: "cors" });
    const blob = await response.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "image.jpg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  } catch (err) {
    console.error("Download failed:", err);
  }
};

// ===== Like Button =====
likeBtn.onclick = () => {
  const currentImgSrc = lightboxImg.src;
  const foundItem = allItems.find(
    (item) => item.querySelector("img").src === currentImgSrc
  );
  if (!foundItem) return;

  const alreadyLiked = favorites.includes(foundItem);

  if (alreadyLiked) {
    favorites = favorites.filter((item) => item !== foundItem);
    likeBtn.classList.remove("liked");
  } else {
    favorites.push(foundItem);
    likeBtn.classList.add("liked");
  }

  updateFavoritesButton();
};

// ===== Show Image in Lightbox =====
function showImage(index) {
  const visibleImages = filteredItems
    .slice((currentPage - 1) * imagesPerPage, currentPage * imagesPerPage)
    .map((item) => item.querySelector("img"));

  currentIndex = (index + visibleImages.length) % visibleImages.length;
  lightboxImg.style.opacity = 0;
  const nextSrc = visibleImages[currentIndex].src;
  const tmp = new Image();
  tmp.onload = () => {
    lightboxImg.src = nextSrc;
    requestAnimationFrame(() => {
      lightboxImg.style.opacity = 1;
    });

    // Set heart color based on favorites
    const foundItem = allItems.find(
      (item) => item.querySelector("img").src === nextSrc
    );
    if (favorites.includes(foundItem)) likeBtn.classList.add("liked");
    else likeBtn.classList.remove("liked");

    resetZoom();
  };
  tmp.src = nextSrc;
}

// ===== Zoom Handling =====
lightboxImg.addEventListener("wheel", (e) => {
  e.preventDefault();
  const zoomSpeed = 0.1;
  if (e.deltaY < 0) {
    zoomLevel += zoomSpeed;
  } else {
    zoomLevel = Math.max(1, zoomLevel - zoomSpeed);
  }
  applyTransform();
});

lightboxImg.addEventListener("mousedown", (e) => {
  if (zoomLevel <= 1) return;
  isDragging = true;
  startX = e.clientX - translateX;
  startY = e.clientY - translateY;
  lightboxImg.style.cursor = "grabbing";
});

document.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  translateX = e.clientX - startX;
  translateY = e.clientY - startY;
  applyTransform();
});

document.addEventListener("mouseup", () => {
  isDragging = false;
  lightboxImg.style.cursor = zoomLevel > 1 ? "grab" : "default";
});

// Touch zoom support
let touchStartDist = 0;
lightboxImg.addEventListener("touchstart", (e) => {
  if (e.touches.length === 2) {
    touchStartDist = getTouchDistance(e.touches);
  }
});

lightboxImg.addEventListener("touchmove", (e) => {
  if (e.touches.length === 2) {
    e.preventDefault();
    const newDist = getTouchDistance(e.touches);
    zoomLevel += (newDist - touchStartDist) / 200;
    zoomLevel = Math.max(1, zoomLevel);
    touchStartDist = newDist;
    applyTransform();
  }
});

function getTouchDistance(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function applyTransform() {
  lightboxImg.style.transform = `scale(${zoomLevel}) translate(${
    translateX / zoomLevel
  }px, ${translateY / zoomLevel}px)`;
}

function resetZoom() {
  zoomLevel = 1;
  translateX = 0;
  translateY = 0;
  applyTransform();
}

// ===== Event Listeners =====
closeBtn.addEventListener("click", () => {
  lightbox.classList.remove("open");
  resetZoom();
});

prevBtn.addEventListener("click", () => {
  showImage(currentIndex - 1);
});

nextBtn.addEventListener("click", () => {
  showImage(currentIndex + 1);
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    document
      .querySelector(".filters button.active")
      ?.classList.remove("active");
    button.classList.add("active");

    const filter = button.dataset.filter;
    if (filter === "all") {
      filteredItems = [...allItems];
    } else {
      filteredItems = allItems.filter(
        (item) => item.dataset.category === filter
      );
    }
    currentPage = 1;
    renderGallery();
  });
});

themeToggle.addEventListener("click", () => {
  document.documentElement.dataset.theme =
    document.documentElement.dataset.theme === "dark" ? "light" : "dark";
});

// ===== Keyboard Navigation =====
document.addEventListener("keydown", (e) => {
  if (!lightbox.classList.contains("open")) return;

  if (e.key === "ArrowRight") {
    showImage(currentIndex + 1);
  } else if (e.key === "ArrowLeft") {
    showImage(currentIndex - 1);
  } else if (e.key === "Escape") {
    lightbox.classList.remove("open");
    resetZoom();
  }
});

// ===== Init =====
renderGallery();
