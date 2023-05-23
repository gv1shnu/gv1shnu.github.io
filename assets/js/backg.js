var currIndex = 1;
  
function imgDisp() {
  var bg = document.getElementById('bg');
  var img = new Image();
  img.src = './images/background/img (' + currIndex + ').jpg';

  img.onload = function () {
    bg.style.backgroundImage = 'url("./images/background/img (' + currIndex + ').jpg';
    bg.style.backgroundRepeat = "no-repeat";
    bg.style.backgroundPosition = "center";
    bg.style.backgroundSize = "cover";
    
    bg.classList.add('fade-in');
    currIndex = Math.max(1, (currIndex + 1) % 13);
  };   

  bg.addEventListener('transitionend', function () {
    bg.classList.remove('fade-in');
  });
}

setInterval(imgDisp, 2500);