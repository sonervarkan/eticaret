// WEATHER API
const weatherApi="39d9af1df8bf49b68b6180918241207";
const city="Ankara";
const apiUrl=`http://api.weatherapi.com/v1/current.json?key=${weatherApi}&q=${city}&aqi=no`;

fetch(apiUrl).then(res=>res.json()).then(data=>{displayWeather(data)});

function displayWeather(data){
    const weatherDiv=document.querySelector(".weather");
    const { location, current } = data;
    weatherDiv.innerHTML=`
    <h2>${data.location.name}</h2>
    <h3>${data.current.temp_c}°C</h3>
    <h5>${data.current.condition.text}</h5>
    `
    //  <img src="https:${current.condition.icon}" alt="${current.condition.text}">
    // img yi h5'in altından buraya alarak iptal ettim
}   
 // EXCHANGE RATE API
 const exchangeRateApi = "0ddc89b2a6b074e99b57f97e";
 const exchangeRateUrl = `https://v6.exchangerate-api.com/v6/${exchangeRateApi}/latest/USD`;

fetch(exchangeRateUrl).then(response => response.json()).then(data => {displayExchangeRate(data)});
 
 // Exchange rate bilgisini ekrana yazdırma
 function displayExchangeRate(data) {
   const exchangeRateDiv = document.querySelector('.exchange');
   const { conversion_rates } = data;
   exchangeRateDiv.innerHTML = `
     <h5>USD to TRY Exchange Rate</h5>
     <p>1 USD = ${conversion_rates.TRY} TRY</p>
   `;
 }
 

 
 //SLIDER
 document.addEventListener('DOMContentLoaded', function() {
  const slides = document.querySelectorAll('.slider-slide');
  const prevButton = document.querySelector('.slider-button.prev');
  const nextButton = document.querySelector('.slider-button.next');
  let currentIndex = 0;
  let interval;
  const slideDuration = 3000; // 3 saniyede bir geçiş

  // Aktif slaytı göster
  function showSlide() {
    // Önce tüm slaytları gizleyerek, yanlışlıkla birden fazla slaytın görünür kalmasını 
    // engelliyoruz.
    slides.forEach(slide => slide.style.display = 'none');
    
    // Sınır kontrolleri
    if (currentIndex < 0) currentIndex = slides.length - 1;
    if (currentIndex >= slides.length) currentIndex = 0;
    
    // Sonra aktif slaytı gösteriyoruz
    slides[currentIndex].style.display = 'block';
  }

  // Otomatik kaydırma
  function startAutoSlide() {
    if (!interval) {
      interval = setInterval(() => {
        currentIndex++;
        showSlide();
      }, slideDuration);
    }
  }

  // Otomatik kaydırmayı durdur
  function stopAutoSlide() {
    clearInterval(interval);
    interval = null;
  }

  // Slider başlatma
  function initSlider() {
    if (slides.length > 0) {
      showSlide();
      startAutoSlide();
      
      // Fare üzerine gelince durdur
      slides.forEach(slide => {
        slide.addEventListener('mouseenter', stopAutoSlide);
        slide.addEventListener('mouseleave', startAutoSlide);
      });

      // Buton kontrolleri
      prevButton.addEventListener('click', () => {
        currentIndex--;
        showSlide();
        stopAutoSlide();
        startAutoSlide(); // Yeniden başlat
      });

      nextButton.addEventListener('click', () => {
        currentIndex++;
        showSlide();
        stopAutoSlide();
        startAutoSlide(); // Yeniden başlat
      });
    }
  }

  initSlider();
});

 /*
 // NEWS API
 // 1. Api: Newsapi.org
 const newsApi="db64a7d2ba11404f89bbf0b2322b7659";
 const newsUrl=`https://newsapi.org/v2/everything?domains=wsj.com&apiKey=${newsApi}`;

 fetch(newsUrl).then(res=>res.json()).then(data=>{displayNews(data)});
 
 function displayNews(data) {
  const newsDiv = document.querySelector('.news-container');
  let articlesContent = ''; // İçerik oluşturma kısmı
  console.log(data);
  // Haberleri oluştur
  data.articles.forEach((article) => {
    articlesContent += `
      <div class="article">
        <h2>${article.title}</h2>
        <a href="${article.url}" target="_blank">Devamını oku</a>
        <hr>
      </div>
    `;
  });

  // İçerikleri hızlıca ekle
  newsDiv.innerHTML = articlesContent;

  // İçerikler yüklendikten sonra .loaded sınıfını ekle
  newsDiv.classList.add('loaded');
}

// 2. Api: newsdata.io
 const newsApi = "pub_85728b9f342214ec379e74330875a2e43fdfb";
 const newsUrl = `https://newsdata.io/api/1/latest?country=tr&apikey=${newsApi}`;
 
 fetch(newsUrl)
   .then(res => res.json())
   .then(data => {
     displayNews(data);
   });
 
 
 function displayNews(data) {
   const newsDiv = document.querySelector(".news-container"); // Eğer id ise # ekledik
   let articlesContent = ""; // Başlangıçta boş string olarak tanımladık
 

 
   data.results.forEach((article) => { // Doğru kullanım: forEach
      // <h2>${article.title}</h2> title paralı diyor onun için eklemedim
     articlesContent += `
       <div class="article">
         <a href="${article.link}" target="_blank">Devamını oku</a>
         <hr>
       </div>
     `;
     console.log(article.link);
   });
 
   newsDiv.innerHTML = articlesContent;
   newsDiv.classList.add('loaded');
 }
 */