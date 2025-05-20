// Game state variables
let firstCard = null;
let secondCard = null;
let lockBoard = false;
let clickCount = 0;
let matchCount = 0;
let totalPairs = 0;
let timeLeft = 60;
let timerId = null;
let comboCount = 0;
let gameOver = false;

const backImage = "back.webp";

// Shuffle array randomly
function shuffle(array) {
  return array.sort(() => 0.5 - Math.random());
}

// Set grid layout based on card count
function setGridDimensions(cardCount) {
  const grid = $("#game_grid")[0];
  const cols = Math.ceil(Math.sqrt(cardCount));
  const rows = Math.ceil(cardCount / cols);
  grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
}

// Update game status display
function updateStatus() {
  $("#clicks").text(`Clicks: ${clickCount}`);
  $("#matches").text(`Matched: ${matchCount}`);
  $("#remaining").text(`Remaining: ${totalPairs - matchCount}`);
  $("#total").text(`Total: ${totalPairs}`);
  $("#time").text(`Time Left: ${timeLeft}s`);
}

// Reset game state
function resetGame() {
  clearInterval(timerId);
  firstCard = null;
  secondCard = null;
  lockBoard = false;
  clickCount = 0;
  matchCount = 0;
  comboCount = 0;
  gameOver = false;              
  $("#game_grid").empty();
  updateStatus();
}


// Start countdown timer
function startTimer() {
  clearInterval(timerId);
  timerId = setInterval(() => {
    timeLeft--;
    updateStatus();
    if (timeLeft <= 0) {
      clearInterval(timerId);
      gameOver = true;            
      alert("⏱️ Time's up! Game Over.");  
    }
  }, 1000);
}

// Return config based on difficulty
function getDifficultyConfig(level) {
  switch (level) {
    case "easy": return { pairs: 3, time: 30 };
    case "medium": return { pairs: 6, time: 60 };
    case "hard": return { pairs: 8, time: 90 };
    default: return { pairs: 5, time: 60 };
  }
}

// Create card element
function createCard(id, src) {
  return $(`
    <div class="card" data-id="${id}">
      <img class="front_face" src="${src}" alt="front" />
      <img class="back_face" src="${backImage}" alt="back" />
    </div>
  `);
}

// Setup new game
function setupGame() {
  resetGame();

  const difficulty = $("#difficulty").val();
  const config = getDifficultyConfig(difficulty);
  totalPairs = config.pairs;
  timeLeft = config.time;
  updateStatus();

  const promises = [];
  for (let i = 0; i < config.pairs; i++) {
    const pokeId = Math.floor(Math.random() * 150) + 1;
    promises.push(
      fetch(`https://pokeapi.co/api/v2/pokemon/${pokeId}`)
        .then(res => res.json())
        .then(data => data.sprites.front_default)
    );
  }

  Promise.all(promises).then(images => {
    const cardImages = shuffle([...images, ...images]);
    setGridDimensions(cardImages.length);

    cardImages.forEach((src, i) => {
      const card = createCard(i, src);
      $("#game_grid").append(card);
    });

    bindCardEvents();
    startTimer();
  });
}

// Card click logic
function bindCardEvents() {
  $(".card").on("click", function () {
    if (lockBoard || $(this).hasClass("flip") || gameOver) return;

    $(this).addClass("flip");

    if (!firstCard) {
      firstCard = $(this);
      clickCount++;
      updateStatus();
      return;
    }

    secondCard = $(this);
    clickCount++;
    updateStatus();

    const img1 = firstCard.find(".front_face").attr("src");
    const img2 = secondCard.find(".front_face").attr("src");

    if (img1 === img2) {
      matchCount++;
      comboCount++;

      if (comboCount === 2) {
        timeLeft += 2;
        comboCount = 0;
      }

      updateStatus();
      firstCard.off("click");
      secondCard.off("click");
      firstCard = null;
      secondCard = null;

      if (matchCount === totalPairs) {
        clearInterval(timerId);
        gameOver = true; 
        alert("🎉 You win!");
      }
    } else {
      comboCount = 0;
      lockBoard = true;
      setTimeout(() => {
        firstCard.removeClass("flip");
        secondCard.removeClass("flip");
        firstCard = null;
        secondCard = null;
        lockBoard = false;
      }, 1000);
    }
  });
}

// Bind start/reset buttons
$(document).ready(() => {
  $("#startBtn").click(setupGame);
  $("#resetBtn").click(resetGame);
  $("#themeToggleBtn").click(() => {
    $("body").toggleClass("dark-mode");
  });
});
