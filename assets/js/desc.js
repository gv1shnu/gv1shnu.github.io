const portfolioTitles = [
  "Tech Enthusiast",
  "CyberSpace Explorer",
  "Jurassic Geek",
  "Gadget Lover",
  "GTA Fanatic"
];

let currentIndex = 0;

function displayNextTitle() {
  document.getElementById("tr").textContent = portfolioTitles[currentIndex];
  currentIndex = (currentIndex + 1) % portfolioTitles.length;
}

setInterval(displayNextTitle, 3000);
