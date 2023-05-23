// Load translations from JSON file
function loadTranslations(callback) {
  var xhr = new XMLHttpRequest();
  xhr.overrideMimeType("application/json");
  xhr.open('GET', 'assets/json/translations.json', true);
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      var translations = JSON.parse(xhr.responseText);
      callback(translations);
    }
  };
  xhr.send(null);
}

// Set the translated text based on the selected language
function setLanguage(language) {
  loadTranslations(function (translations) {
    var elements = document.getElementsByClassName('tr');
    for (var i = 0; i < elements.length; i++) {
      var element = elements[i];
      var key = element.getAttribute('data-key');
      if (translations[language] && translations[language][key]) {
        element.textContent = translations[language][key];
      }
    }
  });
}

var languages = ['eng', 'hin', 'tel'];
var currentLanguageIndex = 0;

function rotateLanguages() {
  var language = languages[currentLanguageIndex];
  setLanguage(language);
  currentLanguageIndex = (currentLanguageIndex + 1) % languages.length;
}

function toggleLanguage() {
  currentLanguageIndex = (currentLanguageIndex + 1) % languages.length;
  var language = languages[currentLanguageIndex];
  setLanguage(language);
}

// Initial language setup
setLanguage(languages[currentLanguageIndex]);

// Rotate languages every 2 seconds
// setInterval(rotateLanguages, 2000);
